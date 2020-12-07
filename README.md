## Описание

### установка пакетов

1. клонировать через git  или скачать приложение
2. https://nodejs.org/en/download/ - node.js
3. https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/  - mongoDB noSQL

если проект пишет, что не хватает какого-то пакета, то необходимо скачать **npm **
и выполнить команду `npm install --save`, обычно npm устанавливается сразу с node.js

### запуск базы данных
после установки mongodb, необходимо запустить сервис

`C:\ProgramFiles\MongoDB\Server\4.4\bin\mongod.exe`
далее необходимо открыть утилиту 

`C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe` 
и использовать команды:
- `use rapid_1c_requests` - выбор БД (возможно придется создать её вручную для вызова списка комманд `help` )
- `db.createCollection("users")` - создание коллекции users
- `db.createCollection("apies") `- создание коллекции apies

### запуск приложения 

для запуска приложения перейти в директорию с проектом  в терминале и вызвать `node app.js`


## Запросы авторизации

( по запросам - вот ссылка на примеры) - https://app.getpostman.com/join-team?invite_code=c23ba6def25fc6ee4aeec0b327287fef

### регистрация в приложении

    

    var settings = {
      "url": "localhost:3000/auth/register",
      "method": "POST",
      "timeout": 0,
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "data": {
        "name": "admin",
        "password": "testpassword",
        "codeword": "coffeine"
      }
    };

Добавит логин и хеш пароля в коллекцию users, вернет токен на 24 часа (секретное слово для доступа к регистрации)


    `{
        "auth": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmY2UwOGJlZjYxZTU5M2I4MDFkZDc4MiIsImlhdCI6MTYwNzMzODE3NSwiZXhwIjoxNjA3NDI0NTc1fQ.BFGo0PcMHq1U8rVR8ZxVlqvAWbJjsUr24eUkyYbXlNA"
    }`
    


### запросы для авторизации  jwt токен



    var settings = {
      "url": "localhost:3000/auth/login",
      "method": "POST",
      "timeout": 0,
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "data": {
        "name": "admin",
        "password": "testpassword"
      }
    };
Так же возвращает токен для дальнейших запросов на 24 часа

## Контроль API в приложении 


### параметры запроса на регистрацию API

- `collection `- название API
- `apiStructure.api_url` - ссылка на api
- `apiStructure.headers` - указать ВСЕ необходимые заголовки
- `apiStructure.bodyparams` - указать что будет передаваться в POST в виде массива [ 'bar', 'foo', ... ] (необходимо заранее указать названия для параметров)
- `apiStructure.urlparams` - указать что будет передаваться в URL в виде массива  [ 'bar', 'foo', ... ] (необходимо заранее указать названия для параметров)
- `apiStructure.response_structure` - указать какие поля будут пристствовать в таблице для хранения результатов запросов в API (не обязательно, пока я не включал строгой проверки на поля)

      var settings = {
          "url": "localhost:3000/app/api_factory",
          "method": "POST",
          "timeout": 0,
          "headers": {
            "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmYjM2YzJhNjFiNDBhMTc4YzRiNTAxZCIsImlhdCI6MTYwNjk4NDMyNCwiZXhwIjoxNjA3MDcwNzI0fQ.OLZ1oZx2qC4L1sSrM7dradBzf7HRR_1-iUywof__naE",
            "Content-Type": "application/json"
          },
          "data": {
      "collection": "client_cards",
      "apiStructure": {
          "api_url":  "http://62.168.226.38:7599/testbd/hs/bonus/getclient",
          "method": "GET",
          "headers": {
              "Authorization": "Basic dHJhY2s6NTZxdHA3"
          },
          "bodyparams": "",
          "urlparams": ["phone", "barcode"],
          "response_structure": 
          { "$jsonSchema": {
         "bsonType": "object",
         "required": [ "Code1C", "Success" ],
         "properties": {
            "Code1C": {
               "bsonType": "string",
               "description": "idtentificator is needed Code1C"
            },
            "Success": {
               "bsonType": "string",
               "description": "must be a string and is required"
            }
         }
    } 
          } 
      }
    };

### запрос на использование API

Необходимо указать имя API в URL параметре - `api_name=client_cards` для использования заготовленного запроса в body передать все необходимые параметры в `urlparams` и `bodyparams` в формате JSON

    var settings = {
      "url": "localhost:3000/app/api_client?api_name=client_cards",
      "method": "POST",
      "timeout": 0,
      "headers": {
        "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmYjM2YzJhNjFiNDBhMTc4YzRiNTAxZCIsImlhdCI6MTYwNjk4NDMyNCwiZXhwIjoxNjA3MDcwNzI0fQ.OLZ1oZx2qC4L1sSrM7dradBzf7HRR_1-iUywof__naE",
        "Content-Type": "application/json"
      },
      "data":
	  {
	  "urlparams":
	 	 {
	  	"phone":"(953) 040-44-04",
	 	 "barcode":"70000006902asdsa28"
	  	}
	  },
    };
	
Ответ сохраняет все поля исходного API, но при этом добавляет поле `memento` как идентификатор последнего удачного запроса к 1С серверу, если запрос будет выполнен с такими же параметрами, то результат запроса заменит эту запись в БД - эти результаты храняться в таблице с наванием API указанным при регистрации в modgoDB
```javascript
{"Code1C":"КУ0004334",
"Name":"Додонова Галина Васильевна",
"Success":true,
"memento":{"urlparams":{"phone":"(953) 040-44-04","barcode":"7000000690228"}}}
```

### Запрос на синхронизацию данных с API 

Так как можно зарегистрировать любой запрос в функционале с регистрацией, то для выгрузки большого количества данных используется следующий запрос 
еслт надо обновить данные, то можно указать параметр operation и update_filter в body запроса

    var settings = {
      "url": "localhost:3000/app/api_insert?api_name=client_cards",
      "method": "POST",
      "timeout": 0,
      "headers": {
        "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmYjM2YzJhNjFiNDBhMTc4YzRiNTAxZCIsImlhdCI6MTYwNzA3MzgwNiwiZXhwIjoxNjA3MTYwMjA2fQ.eBr81bVLXeZ1fV0CM9YIaDN4WV3cNIGDjFIPXV6_1sc",
        "Content-Type": "application/json"
      },
      "update_filter": "{ name: "JHONSOULS"}", // фильтр для UPDATE
	  "operation": "update" //указать если надо обновить данные 
	  
    };
    
    



### запросы для управления ключами коллекции (или таблицы) в mongodb

Метод и параметры
` { method: 'POST', url: '/app/table_factory'}`

Параметры для передачи в запрос:
1. collection передается в URL - это имя таблицы поле которой будут изменены
2. remove_key - указывается в body запроса, соответствует полю которое пользователь хочет удалить
3. operation указывается в body запроса с одним из следующих значений remove_propery, update_propery, delete_propery, read_keys - название операции соответствует её действию со свойтвом таблицы - то есть удаление, переименование, удаление, чтение свойства таблицы





#### пример формирования запроса JS на удаление поля из таблицы users
данный запрос удаляет поле test_new_field1 из таблицы (коллекции) users

   ```javascript
 var request = require('request');
    var options = {
      'method': 'POST',
      'url': 'localhost:3000/app/sync_data?collection=users',
      'headers': {
        'x-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmYjM2YzJhNjFiNDBhMTc4YzRiNTAxZCIsImlhdCI6MTYwNjI5NTQ0NCwiZXhwIjoxNjA2MzgxODQ0fQ._2GzQFm3hqNNUwWUQ5zzxX9aLJKb_xYViWUtevMiy48',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        'remove_key': 'test_new_field1',
        'operation': 'delete_property'
      }
    };
```
#### ответ от сервера
- NewStructure - новая структура после удаления ключа из всех записей (id и v являются частью mongodb, их можно игнорировать)
- Свойства DocumentChanged и MatchCount должны совпадать для сохранения целостности данных, но если вам необходимо хранить записи с разными структурами в одной коллекции, то можно это игнорировать

```javascript
{
    "Success": "Поле с именем <test_new_field10> успешно удалено из таблицы",
    "CollectionName": "users",
    "NewStructure": [
        "_id",
        "name",
        "password",
        "__v"
    ],
    "DocumentsChanged": "2",
    "MatchCount": "2"
}
```



