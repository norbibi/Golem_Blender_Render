# Golem Blender Render v1

The purpose of this repository is to provide a decentralized tool to render your Blender projects.

This Web application run on top of Golem Network.  
Frames will be rendered on remote providers selected by hardware ressources and prices.

Current limitation concerns compositing (especialy Render-Layer node).  
If your design contains compositing you will need to use providers with GPU, else compositing will be disabled.

This repository contains 2 Blender project in blender_project_examples directory as examples:
- 010_0020_A, main blend file is 010_0020_A.lighting, no compositing
- blender-benchmark-class-room, main blend is classroom.blend, with compositing

In order to run this application you will need an Ethereum/Polygon account.  
Simplest way of creation is with Metamask.

This application can be run on the following two subnets:
- devnet-beta on Ethereum Rinkeby
- public-subnet on Polygon network

For the first one nothing to do, rETH & tGLM will be funded automatically on your account.  
For the second one, you will need few MATIC and GLM on your Polygon account (SMALL AMOUNT PLEASE).

Private key must be exported as environment variable:

	- Linux:	export PK=your-privaye-key
	- Windows:	set PK=your-privaye-key

Steps 1 & 2 are optional.

0) Clone repository

	git clone https://github.com/norbibi/Golem_Blender_Render.git
	cd Golem_Blender_Render

1) Build GVMI Golem_Blender_Render

	This image must be build in an environment without NVIDIA GPU (VM for example).

	./build_gvmi.sh

2) Build docker image Golem_Blender_Render

	docker build -t maugnorbert/golem_blender_render:latest Docker_Golem_Blender_Render

3) Run Golem Blender Render

	- Linux:	docker run --rm -ti -e PK=$PK -p 3000:3000 -p 3001:3001 -p 8000:8000 -v $(pwd)/outputs:/home/golem/app/server/outputs maugnorbert/golem_blender_render
	- Windows: 	docker run --rm -ti -e PK=%PK% -p 3000:3000 -p 3001:3001 -p 8000:8000 -v $%CD%/outputs:/home/golem/app/server/outputs maugnorbert/golem_blender_render

4) How to use

	In your browser go to http://localhost:3000

	Configure your render job:

		Select subnet wanted

		In 'Providers' section:
			- Select hardware profile of providers (threads, RAM, storage) required
			- Specify how many workers you want to use
			- Select GPU if needed/wanted

		In 'Budget, Prices & Payment' section:
			- Set your maximum budget you allow for this job, if note reach this treshold the job will be canceled.
			- If enable, set your minimum payment interval you allow.
			- Set your maximum start/thread/env prices allowed

		In 'Timeouts' section:
			- Set your global timeout, it's the the time needed that you estimate to render all frames.
			- Set your upload timeout, it's the maximum time you allow to upload your design to providers (depends on provider's internet link quality)
			- Set your render timeout, it's the maximum time you allow to render one frame (depends on provider's specifications and design complexicity)

		In 'Project' section:
			- Select your project folder.
			- Select main blend file of your project in the blend file list
			- Select frames to render with the slide range

	Click run & wait

Notes:
	- Refresh page abort render job.

	- global timeout above 5h enable mid-agreement wivh seems to have a bug, so don't use for the moment

	- your project frames (and Yagna log file) will be available in a subfolder (named and timestamped) of outputs directory.
 
 	- my gpu providers (RTX3090, 15 threads, 20 Gb RAM, 600Gb storage) prices are 0GLM/start, 0.015 GLM/thread/hour, 1 GLM/env/h,
 	  there are 2 on devnet-beta and 2 on public-beta.

	- Polygon fees are proportional to the number of workers involved and upload time can be (very) long,
	  so set number of providers as a fraction of number of frames (example: 15 providers for 145 frames)
