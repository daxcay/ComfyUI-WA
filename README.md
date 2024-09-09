<a id="readme-top"></a>

<br />
<div align="center">
  <a href="https://github.com/daxcay/ComfyUI-WA">
    <img src="https://github.com/user-attachments/assets/117eab82-ef7a-4199-9a27-68c75ed25861" width="256px" height="128px">
  </a>

  <h3 align="center">WhatsApp in ComfyUI</h3>

  <p align="center">
    <a href="https://github.com/daxcay/ComfyUI-WA/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/daxcay/ComfyUI-WA/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/version-1.0.0-green" >
    <img src="https://img.shields.io/badge/last_update-Sept_2024-green" >
  </p>
  
</div>

# About The Project

This project enables the use of ComfyUI Workflows in WhatsApp.

![WhatsApp](https://github.com/user-attachments/assets/a1f9faa8-4704-4928-8a75-fb7ada4956ad)

<br />

> [!IMPORTANT]
> To log out, first stop ComfyUI and delete the `user` folder from the ComfyUI/WhatsApp directory. Then, restart ComfyUI, and log out from the linked device in WhatsApp.

# Installation

  - ### Installing Using `comfy-cli`
    - `comfy node registry-install ComfyUI-WA`
    - https://registry.comfy.org/publishers/daxcay/nodes/comfyui-wa
  
  - ### Manual Method
    - Go to your `ComfyUI\custom_nodes` and Run CMD.
    - Copy and paste this command: `git clone https://github.com/daxcay/ComfyUI-WA.git`
  
  - ### Automatic Method with [Comfy Manager](https://github.com/ltdrdata/ComfyUI-Manager)
    - Inside ComfyUI > Click the Manager Button on the side.
    - Click `Custom Nodes Manager` and search for `ComfyUI-WA`, then install this node.

  - ### Node Installation
    - Install lateset version of node js.
    - https://nodejs.org/en/download/package-manager
    - for `non-windows` users.  
  
  <br>
  
  >[!IMPORTANT]
  > #### **Restart ComfyUI and Stop ComfyUI before proceeding to next step**


# Setup

From `ComfyUI/WhatsApp` folder open `whatsapp.json`

![image](https://github.com/user-attachments/assets/bf244483-690a-4cb3-9e1b-5016cc78c13e)

![image](https://github.com/user-attachments/assets/b7648e31-7be8-450c-a93f-f04072c694d2)

> [!IMPORTANT]
> Fill `phone_code` and `phone` and save it. this will your admin account.

`phone_code` is tobe entered without `+` and `-`

>[!IMPORTANT]
> #### **Start ComfyUI before proceeding to next step**

## Device Link

>[!IMPORTANT]
> #### **Login from the same number you defined in `whatsapp.json` above**

![download](https://github.com/user-attachments/assets/2a7b080c-8e31-4bc8-b571-f8604dcc202b)

## Enable Dev Mode

>[!IMPORTANT]
> #### **Enable dev mode and save workflow in `api` format to make it compatible.**

![download (1)](https://github.com/user-attachments/assets/15d6fda5-86af-4514-9884-32e7bb4cde84)

## Uploading WorkFlow

To upload a workflow to be used in in whatsapp use the `workflow` button in whatsapp dashboard.

>[!IMPORTANT]
> #### **Attach `WA-ImageSaver` Node before saving the workflow in api format**

![image](https://github.com/user-attachments/assets/42a54f56-8dcc-4831-9d20-1c24ede24b46)

Now upload it in workflow section

![image](https://github.com/user-attachments/assets/10d7a0e6-5279-4d4e-a580-2b1235229a78)


# WhatsApp Commands

Writing **/c** in whatsapp will also provide the list of all commands:

![image](https://github.com/user-attachments/assets/d6ffb055-6285-4648-8396-9aa4bd48091d)

- Write **/wfs** to get a numbered list of uploaded workflows.

![image](https://github.com/user-attachments/assets/f4bafaf7-35e9-4a52-a7a0-7f81544870d9)

- Write **/wf id** to select the workflow.

![image](https://github.com/user-attachments/assets/73fdd686-02d0-4eba-a871-0c8dcc6b403c)

- Write **/wns** to get numbered list of selected workflow nodes.

![image](https://github.com/user-attachments/assets/cebc3fc5-16c9-4257-ad05-01689e4a4861)

- Write **/wn id** to get numbered list of inputs available.

![image](https://github.com/user-attachments/assets/37201990-4e30-4485-a176-730f7e400df1)

- Write **/s node_id input_id value** to set value for input selected.

![image](https://github.com/user-attachments/assets/c5efac5f-fbfc-4b7a-aa2f-835d4a207c99)

- Write **/sce** enable auto ksampler seed change.

![image](https://github.com/user-attachments/assets/8a2975e4-9f5a-4e7b-81be-ac5cf90dd07a)

- Write **/scd** disable auto ksampler seed change.

![image](https://github.com/user-attachments/assets/965b293b-217a-4f52-90ee-7dcb4740f48d)

- Write **/r** to reset all to default settings.

![image](https://github.com/user-attachments/assets/0488b0c2-b42c-487c-b5ca-5330fcfed0d0)

- Write **/q** to queue.

![image](https://github.com/user-attachments/assets/d740d8c9-8e8c-4d5b-b8be-5251b6f2d3e7)

- Write **/i** to interrupt queue.

![image](https://github.com/user-attachments/assets/b6f25a49-1066-4c33-955a-90c652ff3aee)

- Write **/m number** to set bot usage mode. **1**: Single User, **2**: Multi User.'

![image](https://github.com/user-attachments/assets/09c8a252-2fc0-41be-84af-1fac38e74b36)

# Contact

### Daxton Caylor - ComfyUI Node Developer 

  - ### Contact
     - **Email** - daxtoncaylor+Github@gmail.com
     - **Discord Server**: https://discord.gg/Z44Zjpurjp
    
  - ### Support
     - **Patreon**: https://patreon.com/daxtoncaylor
     - **Buy me a coffee**: https://buymeacoffee.com/daxtoncaylor


# Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners. Also it is not guaranteed you will not be blocked by using this method. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.

I have used `NodeJS` and 'Python` combined to make this project the library, I am using the following library in nodejs to enable whatsapp functionality. 

https://github.com/pedroslopez/whatsapp-web.js
