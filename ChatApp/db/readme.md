creation of database in mysql
-------------------------------------------------




create database live_chat;

create table users(id int not null auto_increment, username varchar(255), primary key(id));

create table chat_messages(id int not null auto_increment, message varchar(255), primary key(id));