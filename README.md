# steps

> nodejs, express server, mysql database

1. run the mysql sql script once. be warned it'll delete existing data from that database name.

2. open a terminal like gitbash inside the root directory of the repository and run

```bash
npm install
```

3. run the seed script for the finish types and an admin account. the password is 'admin123'. i recommend changing it.

```bash
node seed.js
```

4. after that you can start the server and access it from the local server using like this, do not include the `s

```bash
node server.js
```

or the npm script

```bash
npm run start
```
