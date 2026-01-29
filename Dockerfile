FROM docker.n8n.io/n8nio/n8n:latest

# The custom nodes will be mounted as a volume at runtime
# No build step needed in Docker - build locally and mount the dist folder
