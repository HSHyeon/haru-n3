import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("lessons", Path(__file__).parents[1] / "scripts/generate-lessons.py")
ai = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ai)


def lesson():
    course = json.loads((ai.ROOT / "src/data/song-courses.json").read_text())[0]
    return {"words": course["words"][:1], "grammar": course["grammar"][:1]}


class GenerationTests(unittest.TestCase):
    def test_invalid_quiz_is_rejected(self):
        data = lesson()
        data["words"][0]["choices"] = ["a", "b", "c", "d"]
        with self.assertRaises(ValueError):
            ai.validate_lesson(data, 1, 1)
        data = lesson()
        data["grammar"][0]["answer"] = True
        with self.assertRaises(ValueError):
            ai.validate_lesson(data, 1, 1)

    def test_incomplete_and_refused_outputs_are_rejected(self):
        for response in [{"status": "incomplete"}, {"status": "completed", "output": [
                {"content": [{"type": "refusal", "refusal": "no"}]}]}]:
            with self.assertRaises(ValueError):
                ai.extract_lesson(response)

    def test_dry_run_never_calls_api_or_writes_key(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "request.json"
            with patch.object(ai, "DRAFTS", Path(temp)), patch.object(ai, "call_api") as api, \
                    patch.dict(os.environ, {"OPENAI_API_KEY": "test-secret"}):
                self.assertEqual(ai.main(["--model", "test-model", "--dry-run", "--output", str(output)]), 0)
                api.assert_not_called()
                self.assertNotIn("test-secret", output.read_text())
                self.assertFalse(json.loads(output.read_text())["store"])

    def test_successful_response_saves_review_draft_without_overwriting(self):
        response = {"status": "completed", "output": [{"type": "message", "content": [
            {"type": "output_text", "text": json.dumps(lesson())}]}]}
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "draft.json"
            with patch.object(ai, "DRAFTS", Path(temp)), \
                    patch.object(ai, "call_api", return_value=response) as api, \
                    patch.dict(os.environ, {"OPENAI_API_KEY": "test-secret"}):
                args = ["--model", "test-model", "--words", "1", "--grammar", "1", "--output", str(output)]
                self.assertEqual(ai.main(args), 0)
                self.assertEqual(json.loads(output.read_text())["status"], "needs-review")
                self.assertEqual(ai.main(args), 1)
                self.assertEqual(api.call_count, 1)

    def test_output_cannot_target_app_source(self):
        with patch.object(ai, "call_api") as api:
            self.assertEqual(ai.main(["--model", "test-model", "--output", str(ai.ROOT / "src/data/bad.json")]), 1)
            api.assert_not_called()


if __name__ == "__main__":
    unittest.main()
