#!/bin/sh

docker rmi docker_gvmi_golem_blender_render:latest
docker build -t docker_gvmi_golem_blender_render Docker_GVMI_Golem_Blender_Render
gvmkit-build docker_gvmi_golem_blender_render:latest
image_hash=$(gvmkit-build docker_gvmi_golem_blender_render:latest --push | grep 'hash link ' | awk '{ print $6 }')
echo "gvmi golem_blender_render hash: " $image_hash