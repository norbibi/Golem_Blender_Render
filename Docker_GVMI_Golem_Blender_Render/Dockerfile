FROM ubuntu:focal-20220801

ENV TZ=Europe/Paris

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
	wget \
	kmod \
	gcc \
	make \
	xz-utils \
	flex \
	bison \
	libssl-dev \
	libelf-dev \
	bc \
	pkg-config \
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

COPY config-virt /usr/src/config-virt
RUN cd /usr/src \
	&& wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.10.29.tar.xz \
	&& tar xavf linux-5.10.29.tar.xz \
	&& cd linux-5.10.29 \
	&& mv /usr/src/config-virt /usr/src/linux-5.10.29/.config \
	&& make olddefconfig \
	&& make -j $(($(nproc --all)-1)) \
	&& make install \
	&& make modules_install \
	&& cd /usr/src \
	&& wget https://download.nvidia.com/XFree86/Linux-x86_64/510.60.02/NVIDIA-Linux-x86_64-510.60.02-no-compat32.run \
	&& chmod +x NVIDIA-Linux-x86_64-510.60.02-no-compat32.run \
	&& ./NVIDIA-Linux-x86_64-510.60.02-no-compat32.run -k 5.10.29 -s --kernel-source-path=/usr/src/linux-5.10.29 \
	&& rm -rf /usr/src/*

ADD https://download.blender.org/release/Blender3.1/blender-3.1.2-linux-x64.tar.xz /opt/
RUN tar -xf /opt/blender-3.1.2-linux-x64.tar.xz -C /opt
RUN mv /opt/blender-3.1.2-linux-x64 /opt/blender
RUN rm /opt/blender-3.1.2-linux-x64.tar.xz
RUN ln -s /opt/blender/blender /usr/bin/blender
COPY disable_compositing.py /usr/src/disable_compositing.py

VOLUME /golem/work /golem/input /golem/output /golem/resources
WORKDIR /golem/work

CMD blob
