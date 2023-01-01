FROM maugnorbert/docker_golem_cuda_base:latest

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
	libglvnd-dev \
	libx11-6 \
	libxi6 \
	libxxf86vm1 \
	libxrender1 \
	libxfixes3 \
	unzip \
	mesa-utils \
	xorg \
	&& rm -rf /var/lib/apt/lists/*

ADD https://download.blender.org/release/Blender3.1/blender-3.1.2-linux-x64.tar.xz /opt/
RUN tar -xf /opt/blender-3.1.2-linux-x64.tar.xz -C /opt
RUN mv /opt/blender-3.1.2-linux-x64 /opt/blender
RUN rm /opt/blender-3.1.2-linux-x64.tar.xz
RUN ln -s /opt/blender/blender /usr/bin/blender
COPY disable_compositing.py /usr/src/disable_compositing.py

VOLUME /golem/work /golem/input /golem/output /golem/resources
WORKDIR /golem/work

CMD blob
