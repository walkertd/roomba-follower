# roomba-follower
Scripts for monitoring a roomba and logging to database.  Based around library dorita980.

At present this polls the roomba at a set minimum time interval.  Data is recorded while running, upon each state change, and after specified intervals where the same state is maintained.

### Configuration
Configuration of the recording script is done through the roomba.json and db.json files.
#### roomba.json
roomba.json contains the connection detail for the roomba as well as the various time intervals.
Example roomba.json below.
Refer to the documentation for the dorita980 library for instructions on how to obtain robot blid, password and IP address.
```
{
  "blid": "yourrobotblid",
  "password": "yourrobotpassword",
  "robotIP": "yourrobotip",
  "pollInterval": 800,
  "pollTimeout": 200,
  "inactiveRecordingInterval": 300
}
```
| Field         | Description   |
| ------------- | ------------- |
| blid          | blid of the robot - obtained using the tools in dorita980.  |
| password      | password of the robot - obtained using the tools in dorita980.  |
| robotIP       | IP of the robot.  |
| pollInterval  | minimum time interval (ms) between polling the robot for data  |
| pollTimeout  | not actually used, not sure what I intended here  |
| inactiveRecordingInterval  | When the robot state is not changing, only write to the database after this polling the robot this many times.  Intended to prevent flooding the database with uninteresting data.  |

#### db.json
db.json contains the connection detail for the postgres database.
Example db.json below.  
```
{
  "username" : "postgres",
  "password": "password",
  "host" : "localhost",
  "port" : 5432,
  "database" : "database"	
}
```

### Creating Databases
This tool needs a database to be created as described in db.create.
The following sections outline how I went about creating a database on
the raspbian instance I'm using.  This is a tad verbose.  In summary, just run the creation SQL in a database and point db.json at it.  Make sure the database you create is correctly referenced in db.json.
#### Run psql
From a linux shell you can use the psql tool. For example the below command would run a psql session as the user postgres.
```
sudo runuser -l postgres -c 'psql'
```
#### Show databases
The \list command will give you a list of databases present.
```
postgres=# \list
                                   List of databases
     Name     |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges
--------------+----------+----------+-------------+-------------+-----------------------
 postgres     | postgres | UTF8     | en_AU.UTF-8 | en_AU.UTF-8 |
 template0    | postgres | UTF8     | en_AU.UTF-8 | en_AU.UTF-8 | =c/postgres          +
              |          |          |             |             | postgres=CTc/postgres
 template1    | postgres | UTF8     | en_AU.UTF-8 | en_AU.UTF-8 | =c/postgres          +
              |          |          |             |             | postgres=CTc/postgres
(3 rows)
```
#### Creating a database
Databases can be created using the appropriate SQL.  For example.
```
postgres=# CREATE DATABASE dbdb;
CREATE DATABASE
postgres=# \list
                                   List of databases
     Name     |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges
--------------+----------+----------+-------------+-------------+-----------------------
 dbdb         | postgres | UTF8     | en_AU.UTF-8 | en_AU.UTF-8 |
 postgres     | postgres | UTF8     | en_AU.UTF-8 | en_AU.UTF-8 |
 template0    | postgres | UTF8     | en_AU.UTF-8 | en_AU.UTF-8 | =c/postgres          +
              |          |          |             |             | postgres=CTc/postgres
 template1    | postgres | UTF8     | en_AU.UTF-8 | en_AU.UTF-8 | =c/postgres          +
              |          |          |             |             | postgres=CTc/postgres
(4 rows)
```
#### Connecting to a database
Connect to the database within psql using the \connect command.
```
postgres=# \connect dbdb
You are now connected to database "dbdb" as user "postgres".
dbdb=# \dt
No relations found.
```
#### Creating recordings table
Create the recordings table by using the SQL provided in db.create.
```
CREATE TABLE recordings (
    id SERIAL PRIMARY KEY,
    time_stamp timestamp default (now()),
    mission_number integer,
    sequence integer,
    initiator character varying(10),
    cycle character varying(10),
    phase character varying(10),
    elapsed_time integer,
    area_cleaned integer,
    expirem integer,
    rechrgm integer,
    notready integer,
    error integer,
    pose_theta real,
    pose_x real,
    pose_y real,
    bin_present boolean,
    bin_full boolean
);
```
```
dbdb=# CREATE TABLE recordings (
dbdb(#     id SERIAL PRIMARY KEY,
dbdb(#     time_stamp timestamp default (now()),
dbdb(#     mission_number integer,
dbdb(#     sequence integer,
dbdb(#     initiator character varying(10),
dbdb(#     cycle character varying(10),
dbdb(#     phase character varying(10),
dbdb(#     elapsed_time integer,
dbdb(#     area_cleaned integer,
dbdb(#     expirem integer,
dbdb(#     rechrgm integer,
dbdb(#     notready integer,
dbdb(#     error integer,
dbdb(#     pose_theta real,
dbdb(#     pose_x real,
dbdb(#     pose_y real,
dbdb(#     bin_present boolean,
dbdb(#     bin_full boolean
dbdb(# );
CREATE TABLE
dbdb=# \dt
           List of relations
 Schema |    Name    | Type  |  Owner
--------+------------+-------+----------
 public | recordings | table | postgres
(1 row)
```
