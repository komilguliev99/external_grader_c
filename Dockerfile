FROM ubuntu as build-stage

RUN apt-get update
RUN apt-get -y install nodejs && apt-get -y install npm && apt-get -y install valgrind \
    && apt install build-essential && apt-get install manpages-dev && apt install

WORKDIR /grader

COPY ./* ./

EXPOSE 80
