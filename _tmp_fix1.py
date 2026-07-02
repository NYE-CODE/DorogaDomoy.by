import sys

paths = [
    r'D:\My Projects\Apps\DorogaDomoy.by\components\shelter-pet-card.tsx',
]


def fix_mixed(data: bytes) -> str:
    s = data.decode('utf-8', errors='surrogateescape')
    out, buf = [], []
    for ch in s:
        o = ord(ch)
        if 0xDC80 <= o <= 0xDCFF:
            buf.append(o - 0xDC00)
        else:
            if buf:
                out.append(bytes(buf).decode('cp1251', errors='replace'))
                buf = []
            out.append(ch)
    if buf:
        out.append(bytes(buf).decode('cp1251', errors='replace'))
    return ''.join(out)


for p in paths:
    data = open(p, 'rb').read()
    text = fix_mixed(data)
    with open(p, 'w', encoding='utf-8-sig', newline='') as f:
        f.write(text)
    print('fixed with BOM:', p)
