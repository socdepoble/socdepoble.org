import os

svg_path = 'public/assets/system/ui/logo-socdepoble-rect-blanc.svg'
with open(svg_path, 'r') as f:
    content = f.read()

# The original has <rect id="logo-socdepoble-rect-blanc" x="0" y="0" width="3333.333" height="866.667" style="fill:none;"/>
# We replace fill:none; with fill:#00662e;
content = content.replace('style="fill:none;"', 'style="fill:#00662e;"')

with open('banner-source.svg', 'w') as f:
    f.write(content)

print("Generated banner-source.svg")
