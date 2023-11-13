const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
//API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});
// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
     player_details
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      * 
    FROM   
       match_details
    WHERE 
      match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject(match));
});
//API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdQuery = `
    select * from player_match_score
    Natural Join match_details
    WHERE player_id = ${playerId};
    `;

  const getMatchDetailsQueryResponse = await database.all(getPlayerIdQuery);
  response.send(
    getMatchDetailsQueryResponse.map((eachMatch) =>
      convertDbObjectToResponseObject(eachMatch)
    )
  );
}); //sending the required response

//API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select player_details.player_id as playerId,player_details.player_name as playerName from player_match_score
    Natural Join player_details
    WHERE match_id=${matchId};

    `;
  const getMatchQueryResponse = await database.get(getMatchQuery);
  response.send(getMatchQueryResponse);
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { player_id } = request.params;
  const getPlayerDetailsQuery = `
    select player_details.player_id as playerId,player_details.player_name as playerName,SUM(player_match_score.score) as TotalScore,SUM(fours) as TotalFours,Sum(sixes) as TotalSixes from player_details
    Inner Join player_match_score
    ON player_details.player_id=player_match_score.player_id
    WHERE player_details.player_id=${playerId};
    `;
  const getPlayerDetailsResponse = await database.get(getPlayerDetailsQuery);
  response.send(getPlayerDetailsResponse);
});
module.exports = app;
