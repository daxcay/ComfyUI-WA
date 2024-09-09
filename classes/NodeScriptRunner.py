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

import shutil
import subprocess
import time
import threading


class NodeScriptRunner:
    def __init__(self):
        self.scripts = []
        self.processes = []
        self.should_run = True

    def check_for_node_js(self):
        return shutil.which('node') is not None

    def add(self, cwd, script):
        self.scripts.append((cwd, script))

    def start_script(self, cwd, script):
        process = subprocess.Popen(script, cwd=cwd, stdout=None, stderr=None)
        self.processes.append((process, cwd, script))
        print(f"[COMFYUI_WA] --> Project script '{script}' in '{cwd}' started.")
        return process

    def monitor_scripts(self):
        while self.should_run:
            for i, (process, cwd, script) in enumerate(self.processes):
                if process.poll() is not None:  # Check if the process has terminated
                    print(f"[COMFYUI_WA] --> Project script '{script}' in '{cwd}' terminated unexpectedly.")
                    new_process = self.start_script(cwd, script)
                    self.processes[i] = (new_process, cwd, script)
            time.sleep(1)  # Check every second

    def run(self):
        try:
            if not self.check_for_node_js():
                print("[COMFYUI_WA] --> Node.js is not installed or not found in the system path.")
                return
            
            for cwd, script in self.scripts:
                self.start_script(cwd, script)
            
            # monitor_thread = threading.Thread(target=self.monitor_scripts)
            # monitor_thread.start()
        except FileNotFoundError:
            print("[COMFYUI_WA] --> Node.js is not installed or not found in the system path.")
        except Exception as e:
            print(f'[COMFYUI_WA] --> NodeJS failed to start script. Error: {e}')

    def terminate_background_js(self):
        self.should_run = False  # Stop monitoring
        for process, cwd, script in self.processes:
            if process:
                process.terminate()
                print(f"[COMFYUI_WA] --> Project script '{script}' in '{cwd}' terminated.")
            else:
                print("[COMFYUI_WA] --> No background JavaScript process is running.")

    def __del__(self):
        self.terminate_background_js()
