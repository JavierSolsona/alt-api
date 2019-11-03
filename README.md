# altapi
## Perparate the enviorment
Install **nodejs** version 12.11.0

Install **npm** version 6.11.3

Run the command **npm install** for install the dependencies

## Configure the project

### Enviorment

In the .env file can configure the run option for nodejs (development, test or production) and the port to use.

### DataBase

The project uses a MySQL DataBase

Create an empty DataBase and a user and give permission to the user over the DataBase

In the **/config/config.json** file update the values for the environment selected in the .env file with the DataBase name, user name and user password.

If the enviorment if different to development run the command **NODE_ENV=enviorment npx sequelize-cli db:migrate** and then the command  **NODE_ENV=enviorment npx sequelize-cli db:seed:all** where enviorment is the same at .env file

If the environment is development the NODE_ENV flag can be omitted

## Run the project

Use the command **npm start**