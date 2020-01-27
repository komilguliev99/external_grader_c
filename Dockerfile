FROM ubuntu as build-stage

WORKDIR /grader

COPY ./* ./

RUN apt-get update && apt-get -y install nodejs && apt-get -y install npm
RUN npm install
RUN apt install build-essential && apt-get install manpages-dev
RUN apt-get -y install valgrind


COPY . .

EXPOSE 80
