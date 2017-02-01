FROM node:6

RUN mkdir parse

ADD . /parse
WORKDIR /parse
RUN npm install

VOLUME /parse/cloud
VOLUME /parse/public

CMD [ "/parse/start.sh" ]
