# After Bell image assets

All four assets were generated with the built-in `image_gen__imagegen` tool on 2026-10-12. Images were inspected, then resized to a maximum 1024-pixel edge and encoded as WebP quality 87 using Pillow. Original PNG files remain in the workspace's `generated_images` folder. Resizing and compression were the only postprocessing operations.

| File | Dimensions | Intended use |
| --- | --- | --- |
| `guardian.webp` | 1024 × 1024 | GoGuardian jumpscare, edited from user-provided shield logo |
| `band.webp` | 1024 × 1024 | Male band teacher jumpscare: black hair, round glasses, maroon blazer, white shirt, black tie |
| `teacher.webp` | 1024 × 1024 | Female teacher jumpscare: silver bob, teal cardigan, white blouse |
| `cover.webp` | 1024 × 439 | School hallway cover / game card art |

## Final prompts

### guardian.webp

Edit target: `/workspace/scratch/7d0174bf0132/upload/image(20261012-195259).png`. `transparent_background: false`.

```text
Use case: precise-object-edit. Asset type: full-screen horror game jumpscare. Edit target: provided GoGuardian segmented shield logo. Preserve recognizable EXACT segmented shield silhouette, dark teal upper curved shield pieces, cyan lower V, open central hollow. Remove the text and white background, replace with near-black darkness. Make shield huge centered filling most of square frame. Make original teal and cyan extremely dim with muted deep red ominous edge lighting. In center hollow place one frightening high-detail realistic staring human eye, red pupil glow, grey veins, eerie and uncanny. Cinematic photoreal surface detail and faint digital grain. Subject sharp and identifiable in darkness, scary but no gore. No text, no watermark. The shield logo shape must remain recognizable. Square image.
```

### band.webp

New generation. `transparent_background: false`.

```text
Use case: stylized-concept. Asset type: high quality full-screen horror game jumpscare portrait, square. Fictional male school band teacher, adult pale man, swept black hair, ROUND THIN BLACK GLASSES, MAROON BLAZER, WHITE SHIRT, THIN BLACK TIE. These exact distinguishing features must be visible. Human but slightly off, unnaturally fixed small too-wide smile, intense never-blinking eyes, uncanny slight asymmetry. Face fills frame and stares directly at viewer, upper shoulders visible. Dim school band room behind, brass instruments faintly visible. High quality cinematic realistic 3D portrait with fine skin texture and believable clothes; eerie low-key blue light and dim red edge lighting. Scaryish and startling without any blood, gore, wounds, monster teeth, or physical mutilation. No text, no watermark. Square image.
```

### teacher.webp

New generation. `transparent_background: false`.

```text
Use case: stylized-concept. Asset type: high quality full-screen horror game jumpscare portrait, square. Fictional middle-aged school teacher, pale human woman with SILVER BOB HAIR, TEAL CARDIGAN and WHITE BLOUSE. These exact distinguishing features must be visible. Human looking but slightly wrong: never-blinking watching eyes, unnaturally fixed subtle smile, slightly uncanny proportion and head tilt. Face fills frame staring straight into viewer, upper shoulders visible. Dim empty school hallway with lockers behind. High quality cinematic realistic 3D portrait, detailed fine skin texture and believable clothes; eerie low-key cold blue lighting and dim red edge light. Scaryish and startling without blood, gore, wounds, monster teeth, or physical mutilation. No text, no watermark. Square image.
```

### cover.webp

New generation. `transparent_background: false`.

```text
Use case: stylized-concept. Asset type: wide cinematic game cover artwork for 3D school horror game. Cartoony low-poly but polished empty school hallway after lights-out, exaggerated teal lockers, glossy dark floor, desks through open classroom doors, warm industrial light at far end. Foreground flashlight beam lights abandoned backpack and golden key. At distant hall corner silhouettes of subtly uncanny human teachers, one man maroon blazer and black hair, one woman silver bob and teal cardigan; above a dim monitor shows an ominous single eye inside dark teal segmented shield. Moody dark blue fog and muted red lighting accents, appealing dark cartoony 3D game graphics with chunky clear shapes. Wide landscape composition, atmospheric, school setting readable. No text, no watermark, no gore.
```
