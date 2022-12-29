FROM ubuntu:focal-20220801

ENV TZ=Europe/Paris

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update && apt-get install -y \
	curl \
	jq \
	psmisc \
	python3-pip \
	libx11-6 \
	libxi6 \
	libxxf86vm1 \
	libxrender1 \
	libxfixes3 \
	libgl1 \
	&& rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

RUN apt-get update && apt-get install -y \
	nodejs \
	&& rm -rf /var/lib/apt/lists/*

RUN npm install -g yarn typescript
RUN pip3 install yapapi

ADD https://download.blender.org/release/Blender3.1/blender-3.1.2-linux-x64.tar.xz /opt/
RUN tar -xf /opt/blender-3.1.2-linux-x64.tar.xz -C /opt
RUN mv /opt/blender-3.1.2-linux-x64 /opt/blender
RUN rm /opt/blender-3.1.2-linux-x64.tar.xz
RUN ln -s /opt/blender/blender /usr/bin/blender

RUN useradd golem -m

ADD app /home/golem/app
ADD start.sh /home/golem/start.sh
RUN chmod +x /home/golem/start.sh

RUN chown -R golem:golem /home/golem

USER golem
WORKDIR /home/golem/

RUN mkdir -p /home/golem/.local/share/ya-installer/terms
RUN touch /home/golem/.local/share/ya-installer/terms/testnet-01.tag
RUN curl -sSf https://join.golem.network/as-requestor | bash - || echo "yes"

ENV PATH=${PATH}:/home/golem/.local/bin/:/home/golem/.local/:/usr/bin

RUN cd /home/golem/app/server && yarn install
RUN cd /home/golem/app/react && yarn install

CMD ["/home/golem/start.sh"]
