# BrewIO Server

---

Back end server and database for the [BrewIO mobile app](https://github.com/ARW2705/BrewIO-App).


## Getting Started

---

### Prerequisites

To clone and run this application, you'll need [Git](https://git-scm.com/), [Node.js](https://nodejs.org/en/), and [MongoDB](https://www.mongodb.com/)

The following environment variables are required:
* **MONGO_URL** - contains mongoose connection url with credentials (eg. "mongodb://dbuser:dbpass@localhost:27017/dbname")
* **TOKEN_KEY** - a secret string to generate json web tokens


### Installation

Clone this repository
`$ git clone `

Change to project directory
`$ cd brewIO-server`

Install Dependencies
`$ npm install`

Start server
`$ npm run start`


## Built With

---

* [NPM](https://www.npmjs.com/) - Dependency management
* [Express.js](https://expressjs.com/) - Server framework
* [Passort.js](http://www.passportjs.org/) - Authentication framework
* [Mongoose](https://mongoosejs.com/) - ODM
* [MongoDB](https://www.mongodb.com/) - Database


## License

---

This project is licensed under the MIT License - see the [LICENSE](https://github.com/ARW2705/BrewIO-Server/blob/master/LICENSE) file for details.
