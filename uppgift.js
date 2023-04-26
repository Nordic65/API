const mysql = require("mysql");
const express = require("express");
const crypto = require("crypto");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mydb",
});

con.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL database!");
});

app.get("/", (req, res) => {
  res.send(`
    <h1>Dokumentation av olika API</h1>
    
    <ul>
    
    <li> GET /Users - returnerar alla användare (Kräver inloggning (TOKEN))</li>

    <li> GET /Users?id=?&Username=?&first_name=?&last_name=? - returnerar alla användare som har matchande parametrar (nycklar), OBS! Alla parametrar behövs inte, du kan skriva dem du vill söka på. (Kräver inloggning (TOKEN))</li>
    
    <li> GET /Users:id - returnerar användare med angivet id (Kräver inloggning (TOKEN)) </li>
    
    <li>POST /RegisterUser - skapa ett konto</li>
    
    <li>POST /loggin - logga in på ditt konto </li>
    
    </ul>`);
});

secret = "secret of secrets";

app.get("/users", function (req, res) {
  let authHeader = req.headers["authorization"];
  if (authHeader == undefined) {
  }
  let decoded;
  try {
    decoded = jwt.verify(token, "secret of secrets");
  } catch (err) {
    console.log(err);
    res.status(401).send("invalid auth token");
  }
  var sql = `SELECT * FROM users`;
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.json(result);
  });
});

app.get("/users/:id", function (req, res) {
  let authHeader = req.headers["authorization"];
  if (authHeader == undefined) {
  }
  let decoded;
  try {
    decoded = jwt.verify(token, "secret of secrets");
  } catch (err) {
    console.log(err);
    res.status(401).send("invalid auth token");
  }
  var sql = `SELECT * FROM users WHERE id = ${req.params.id}`;
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.json(result);
  });
});

function hash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

function isValidUserData(body) {
  return body && body.username;
}
app.post("/users", function (req, res) {
  const password = hash(req.body.password);
  let authHeader = req.headers["authorization"];
    if (authHeader == undefined) {
    }
    let decoded;
    try {
      decoded = jwt.verify(token, "secret of secrets");
    } catch (err) {
      console.log(err);
      res.status(401).send("invalid auth token");
    }

  if (isValidUserData(req.body)) {
    var sql = `SELECT * FROM users WHERE username='${req.body.username}'`;
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      if (result.length > 0) {
        res.status(409).send("Username already exists");
      } else {
        var sql = `INSERT INTO users (username, first_name, last_name, password)
          VALUES ('${req.body.username}','${req.body.first_name}','${req.body.last_name}','${password}')`;
        con.query(sql, function (err, result, fields) {
          if (err) throw err;
          res.json(result);
          console.log(result);
        });
      }
    });
  } else {
    res.sendStatus(422);
  }
});


app.post("/login", function (req, res) {
  const password = hash(req.body.password);
  if (isValidUserData(req.body)) {
    var sql = `SELECT * FROM users WHERE username='${req.body.username}'`;
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      console.log(password);
      console.log(result[0]);
      if (password === result[0].password) {
        let payload = {
          sub: result[0].id,
          username: result[0].username,
          first_name: result[0].first_name,
          last_name: result[0].last_name,
        };
        var token = jwt.sign(payload, "secret of secrets", { expiresIn: "1h" });
        res.send("Inloggning_lyckades \n" + token);
      } else {
        res.send("Wrong login credentials!");
      }
    });
  } else {
    res.sendStatus(422);
  }
});


app.put("/update/:id", function (req, res) {
  const password = hash(req.body.password);
  let authHeader = req.headers["authorization"];
  if (authHeader == undefined) {
  }
  let decoded;
  try {
    decoded = jwt.verify(token, "secret of secrets");
  } catch (err) {
    console.log(err);
    res.status(401).send("invalid auth token");
  }
  if (isValidUserData(req.body)) {
    var sql = `UPDATE users 
    SET username = '${req.body.username}', first_name = '${req.body.first_name}', last_name = '${req.body.last_name}', password = '${password}' WHERE id = ${req.params.id}`;
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      res.json(result);
      console.log(result);
    });
  } else {
    res.sendStatus(422);
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});