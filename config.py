# Copyright 2024 Daxton Caylor
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import os, json

NODE_JS_ACTIVE = True
NODE_JS_INSTALLER_URL = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
NODE_JS_FOLDER = "nodejs"

def edit_package_json(file_path, updates):
    """
    Edits the given JSON file dynamically based on the updates provided.
    
    :param file_path: The path to the JSON file.
    :param updates: A dictionary with the updates to apply.
    :return: None
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"[COMFYUI_WA] --> {file_path} does not exist")
    
    with open(file_path, 'r') as file:
        package_data = json.load(file)

    for key, value in updates.items():
        if isinstance(value, dict) and key in package_data:
            package_data[key].update(value)
        else:
            package_data[key] = value

    with open(file_path, 'w') as file:
        json.dump(package_data, file, indent=4)

    print(f"[COMFYUI_WA] --> Updated {file_path} successfully.")


def update_config(config_file, default_config):
    # If the config file doesn't exist, create it with the default values
    if not os.path.exists(config_file):
        with open(config_file, 'w') as f:
            json.dump(default_config, f, indent=4)
        print(f"Config file created with default settings.")
    else:
        # Load the existing config
        with open(config_file, 'r') as f:
            config_data = json.load(f)
        
        # Check for missing keys and update them
        updated = False
        for key, value in default_config.items():
            if key not in config_data:
                config_data[key] = value
                updated = True
        
        # If updates are made, rewrite the config file
        if updated:
            with open(config_file, 'w') as f:
                json.dump(config_data, f, indent=4)
            print(f"Config file updated with missing keys.")
        else:
            print(f"No updates needed, config file is up to date.")