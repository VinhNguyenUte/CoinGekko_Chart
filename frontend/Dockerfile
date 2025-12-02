FROM nginx:alpine

COPY source/index.html /usr/share/nginx/html/index.html
COPY source/css /usr/share/nginx/html/css
COPY source/js /usr/share/nginx/html/js

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
