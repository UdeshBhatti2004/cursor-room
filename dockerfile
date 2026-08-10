# /// Buid the Frontend using npm run build
# /// It will create a dist copy the content of dist folder and paste into backend public
# // folder copy the dist content not dist folder

FROM node:20-alpine AS frontend-builder

COPY ./client /app

WORKDIR /app

RUN npm install

RUN npm run build

# // Build the backend

FROM node:20-alpine 

COPY ./server /app

WORKDIR /app

RUN npm install

COPY --from=frontend-builder /app/dist /app/public

CMD ["npm","start"]