FROM node:6

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /parse && cp -a /tmp/node_modules /parse/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /parse
ADD . /parse

EXPOSE 1337

VOLUME /parse/cloud
VOLUME /parse/public

CMD [ "/parse/start.sh" ]
