# Cow parts

Cuts the cow artwork (`master.png`, 1024 x 1024) into the pieces the mascot rig animates.
Not part of the app build; run by hand when the artwork or the cut lines change.

```sh
pip install pillow numpy opencv-python-headless "rembg[cpu]"
python3 cut_bg.py   # work/alpha.png (downloads the cut-out model on first run)
python3 build.py    # assets/cow/*, src/mascot/skins/moo.parts.ts, work/preview_*.png
python3 icons.py    # assets/icon.png, assets/splash-icon.png
```

- The background mask (`work/alpha.png`) comes from `rembg` (model `isnet-general-use`), thresholded,
  hole-filled, eroded 1 px and softened. The cow's white is too close to the backdrop for colour keying.
- `build.py` holds every cut line and pivot as pixel coordinates of the master. After a change, look at
  `work/preview_moved.png` and `work/preview_moved2.png`: they pose every joint to show seams and holes.
- `work/` is scratch and is not committed.
