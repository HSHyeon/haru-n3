"""Generate Haru's original moon-and-note icons using only the standard library."""
from pathlib import Path
import struct, zlib
root = Path(__file__).resolve().parent.parent / 'public' / 'icons'
root.mkdir(exist_ok=True)

def icon(n, filename):
    pixels = bytearray()
    for row in range(n):
        pixels.append(0)
        for col in range(n):
            x,y=(col+.5)/n,(row+.5)/n
            bg=(36,59,91)
            moon=(x-.46)**2+(y-.48)**2 < .235**2 and (x-.555)**2+(y-.395)**2 > .205**2
            note=((x-.648)/.061)**2+((y-.634)/.043)**2 < 1 or (.679<x<.706 and .376<y<.635) or (.69<x<.78 and .376<y<.409)
            star=abs(x-.704)/.035+abs(y-.263)/.045<1
            pixels.extend((233,229,212) if moon else (177,197,211) if note else (190,171,129) if star else bg)
    def chunk(tag,data):
        return struct.pack('!I',len(data))+tag+data+struct.pack('!I',zlib.crc32(tag+data)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!IIBBBBB',n,n,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(pixels,9))+chunk(b'IEND',b'')
    (root/filename).write_bytes(png)
for n,name in [(192,'icon-192.png'),(512,'icon-512.png'),(512,'icon-maskable-512.png'),(180,'apple-touch-icon.png')]:
    icon(n,name)

# Traditional multi-resolution favicon for browser tabs and bookmarks.
for n in [16,32]:
    icon(n, f'favicon-{n}.png')
images=[(n,(root/f'favicon-{n}.png').read_bytes()) for n in [16,32]]
offset=6+16*len(images)
entries=[]
for n,data in images:
    entries.append(struct.pack('<BBBBHHII',n,n,0,0,1,32,len(data),offset))
    offset+=len(data)
(root.parent/'favicon.ico').write_bytes(struct.pack('<HHH',0,1,len(images))+b''.join(entries)+b''.join(data for _,data in images))
