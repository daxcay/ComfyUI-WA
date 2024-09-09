import os
import json
import json
import numpy as np
from PIL import Image
from PIL.PngImagePlugin import PngInfo
from comfy.cli_args import args

def count_files_in_folder(folder_path):
    file_count = 0
    for _, _, files in os.walk(folder_path):
        file_count += len(files)
    return file_count

def delete_files_in_folder(folder_path): 
    for file in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"[COMFYUI_WA] --> Failed to delete file '{file_path}': {e}")

class WA_ImageSaver:

    def __init__(self):
        self.compression = 4

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "Images": ("IMAGE",),
                "Path": ("STRING", {}),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = ()
    FUNCTION = "Save"
    OUTPUT_NODE = True

    CATEGORY = "🟢 COMFYUI-WA 🟢"

    def Save(self, Images, Path, prompt=None, extra_pnginfo=None):

        results = []

        try:

            if not os.path.exists(Path):
                os.makedirs(Path)

            # delete_files_in_folder(Path)
            lastIndex = count_files_in_folder(Path)
            index = 1

            for image in Images:
                image = image.cpu().numpy()
                image = (image * 255).astype(np.uint8)
                img = Image.fromarray(image)
                metadata = None
                if not args.disable_metadata:
                    metadata = PngInfo()
                    if prompt is not None:
                        metadata.add_text("prompt", json.dumps(prompt))
                    if extra_pnginfo is not None:
                        for x in extra_pnginfo:
                            metadata.add_text(x, json.dumps(extra_pnginfo[x]))
                
                padding = str(lastIndex+index).zfill(4)
                file_name = f"{padding}.png"
                file_path = os.path.join(Path, file_name)
                img.save(file_path, pnginfo=metadata, compress_level=self.compression)
                index = index + 1
                results.append({
                    "filename": file_name,
                    "subfolder": Path,
                    "type": "output"
                })

        except Exception as e:
            print(f"[COMFYUI_WA] --> Error saving image: {e}")

        return ({ "ui": { "images": results } })


N_CLASS_MAPPINGS = {
    "WA_ImageSaver": WA_ImageSaver,
}

N_DISPLAY_NAME_MAPPINGS = {
    "WA_ImageSaver": "WA_ImageSaver",
}
