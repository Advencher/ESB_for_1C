import Boom from "boom";
import isEmptyObject, { dataTypeChecker } from "../utils/DataTypeChecker.js";

export class MongoController {
  constructor(mongoNative) {
    this.mongoNative = mongoNative;
    this.chageTableProperties = this.chageTableProperties.bind(this);
    this.queryData = this.queryData.bind(this);
    this.updateCollection = this.updateCollection.bind(this);
  }

  async chageTableProperties(req, res) {
    if (!req.query.collection)
      return Boom.boomify(
        new Error("collection не указан в url в качестве параметра"),
        { statusCode: 400 }
      );

    let collection;
    try {
      collection = await this.mongoNative
        .db("rapid_1c_requests")
        .collection(req.query.collection);
    } catch (error) {
      return Boom.boomify(error, { statusCode: 404 });
    }
    switch (req.body.operation) {
      case "add_property":
        return await this.createKey(req, res, collection);
      case "delete_property":
        return await this.deleteKey(req, res, collection);
      case "update_property":
        return await this.updateKey(req, res, collection);
      case "create_table":
        return await this.createTable(req, res, req.query.collection);
      default:
        return Boom.methodNotAllowed(
          "операция не указана, или указана не верно\n доступные операции add|delete|update_property, create_table, delete table"
        );
    }
  }

  //обработка запроса к mongodb
  async queryData(req, res) {
    if (!req.query.collection) {
      return Boom.boomify(new Error(), {
        statusCode: 404,
        message: "Параметр collection не указан",
      });
    }
    const collection = this.mongoNative
      .db("rapid_1c_requests")
      .collection(req.query.collection);
    if (!collection)
      return Boom.boomify(
        new Error(`не найдена коллекция с именем <${req.query.collection}>`),
        { statusCode: 404 }
      );
    let query = {},
      projection = {};
    let check =
      req.query.collection === "users"
        ? res.status(500).send({
            statusCode: 500,
            message: "No users for you :)",
          })
        : (projection = { _id: 0, __v: 0 });
    if (req.query.select) {
      query = req.query.select;
    }
    if (req.query.projection) {
      projection = { ...JSON.parse(req.query.projection), ...projection };
    }

    try {
      const queryResult = await collection.find(query, projection).toArray();
      return res.status(200).send(doc);
    } catch (error) {
      return Boom.boomify(err, {
        message: "ошибка во время запроса (╯°□°）╯︵ ┻━┻",
      });
    }
  }

  //методы для управления таблицами в mongodb
  async createKey(req, res, collection) {
    if (!req.body.new_key || !req.body.data_type)
      return Boom.boomify(
        new Error(
          "параметер new_key и(или) data_type не указан в body запроса"
        ),
        {
          statusCode: 400,
        }
      );
    let addNewField;

    try {
      switch (req.body.data_type) {
        case "String":
          addNewField = await collection.updateMany(
            {},
            { $set: { [req.body.new_key]: "default_string" } },
            { strict: false }
          );
          break;

        case "Array":
          addNewField = await collection.updateMany(
            {},
            { $set: { [req.body.new_key]: [] } },
            { strict: false }
          );
          break;

        case "Object":
          addNewField = await collection.updateMany(
            {},
            { $set: { [req.body.new_key]: {} } },
            { strict: false }
          );
          break;

        case "Number":
          addNewField = await collection.updateMany(
            {},
            { $set: { [req.body.new_key]: 0 } },
            { strict: false }
          );
          break;
        default:
          return Boom.badRequest("Только Array, Object, Number или String");
      }
    } catch (err) {
      return Boom.boomify(err, {
        message:
          "при добавлении поля произошла ошибка, возможно поле с таким именем уже существует",
      });
    }

    let newKeys = [];
    let doc = await collection.findOne();
    for (let key in doc) newKeys.push(key);
    return res.status(200).send({
      Success: `Поле с именем <${req.body.new_key}> успешно добавлено`,
      CollectionName: `${collection.collectionName}`,
      NewStructure: `${newKeys}`,
    });
  }

  //delete key from table
  async deleteKey(req, res, collection) {
    if (!req.body.remove_key)
      return Boom.boomify(
        new Error("нужно указать параметер remove_key в url запроса"),
        { statusCode: 400 }
      );
    try {
      const resultRemove = await collection.updateMany(
        {},
        { $unset: { [req.body.remove_key]: 1 } }
      );
      if (resultRemove.modifiedCount > 0) {
        let newKeys = [];
        let doc = await collection.findOne();
        for (let key in doc) newKeys.push(key);
        return res.status(200).send({
          Success: `Поле с именем <${req.body.remove_key}> успешно удалено из таблицы`,
          CollectionName: `${collection.collectionName}`,
          NewStructure: newKeys,
          DocumentsChanged: `${resultRemove.modifiedCount}`,
          MatchCount: `${resultRemove.matchedCount}`,
        });
      } else
        return res.status(200).send({
          Failure: `в таблице с именем <${collection.collectionName}> не существует поля <${req.body.remove_key}>`,
        });
    } catch (err) {
      return Boom.boomify(err, {
        statusCode: 404,
        message: "Ошибка при изменении таблицы",
      });
    }
  }

  //update key
  async updateKey(req, res, collection) {
    if (!req.body.query_object)
      return Boom.boomify(
        new Error("нужно указать параметер query_object в body запроса"),
        {
          statusCode: 400,
          message:
            "see https://docs.mongodb.com/manual/reference/operator/update/rename/",
        }
      );
    try {
      let newKeys,
        old_keys = [];
      let doc = await collection.findOne();

      for (let key in doc) old_keys.push(key);

      const updateResult = collection.updateMany(
        {},
        { $rename: [req.body.query_object] }
      );

      if (updateResult.modifiedCount > 0) {
        doc = await collection.findOne();
        for (let key in doc) newKeys.push(key);
        return res.status(200).send({
          Success: `Поле с именем <${req.body.query_object}> успешно переименовано`,
          Collection: `${collection.collectionName}`,
          NewStructure: newKeys,
          OldStructure: old_keys,
        });
      }
    } catch (err) {
      return Boom.boomify(err, {
        statusCode: 500,
        message: "ошибка во время переименования поля(ей)",
      });
    }
  }

  //crud operations /app/crud
  async updateCollection(req, res) {
    if (!req.query.collection)
      return Boom.boomify(
        new Error("collection не указан в url в качестве параметра"),
        { statusCode: 400 }
      );

    let collection;
    try {
      collection = await this.mongoNative
        .db("rapid_1c_requests")
        .collection(req.query.collection);
    } catch (error) {
      return Boom.boomify(error, { statusCode: 404 });
    }

    switch (req.body.operation) {
      case "insert":
        return await this.crudInsert(req, res, collection);
      case "update":
        return await this.crudDelete(req, res, collection);
      case "delete":
        return await this.crudUpdate(req, res, collection);
      default:
        return Boom.methodNotAllowed(
          "операция не указана, или указана не верно\n доступные операции insert|delete|update, create_table, delete_table"
        );
    }
  }

  async crudUpdate(req, res, collection) {
    if (!req.body.changes.fieldsAndValues)
      return Boom.badRequest("поле(я) для обновления не указаны");
    try {
      let updateResult = await collection.updateMany(
        req.body.filter,
        fieldsAndValues
      );
      if (updateResult.modifiedCount > 0) {
        return res.status(200).sent({
          Success: `поля успешно обновлены в таблице ${collection.CollectionName}`,
          ModifiedCount: updateResult.modifiedCount,
          MatchCount: updateResult.matchedCount,
        });
      } else {
        return res.status(200).sent({
          Failure: `данные в таблице ${collection.CollectionName} не были обновлены`,
        });
      }
    } catch (error) {
      return Boom.boomify(error);
    }
  }

  async crudInsert(req, res, collection) {
    if (!req.body.changes.fieldsAndValues)
      return Boom.badRequest("поле(я) и значения для добавления не указаны");
    try {
      let insertResult = await collection.insert(req.body.changes.fieldsAndValues, {
        ordered: false
      });
      if (insertResult.insertedCount > 0) {
        return res.status(200).send({
          Success: `поля успешно добавлены в таблицу ${collection.collectionName}`,
          InsertedCount: insertResult.insertedCount,
        });
      } else {
        return res.status(200).send({
          Failure: `данные не были добавлены в коллекцию ${collection.CollectionName}`,
        });
      }
    } catch (error) {
      return Boom.boomify(error);
    }
  }

  async crudDelete(req, res, collection) {
    if (!req.body.filter)
      return Boom.badRequest("условие для удаления не указано");
    try {
      let deleteResult = await collection.deleteMany(req.body.filter);
      if (deleteResult.deleteCount > 0) {
        return res.status(200).sent({
          Success: `поля(е) успешно удалены в таблице ${collection.CollectionName}`,
          DeleteCount: deleteResult.deleteCount,
        });
      } else {
        return res.status(200).sent({
          Failure: `данные в таблице ${collection.CollectionName} не были удалены`,
          DeleteCount: deleteResult.deleteCount,
        });
      }
    } catch (error) {
      return Boom.boomify(error);
    }
  }

  //https://docs.mongodb.com/manual/reference/method/db.createCollection/
  async createTable(req, res, collection_name) {
    let newCollection;
    if (!collection_name)
      return Boom.badRequest("не указано имя новой таблицы для базы данных");
    if (req.body.options) {
      try {
        newCollection = await this.mongoNative
          .db("rapid_1c_requests")
          .createCollection(collection_name, {validator: req.body.options.response_structure});
      } catch (error) {
        return Boom.boomify(error);
      }
    } else {
      newCollection = await this.mongoNative
      .db("rapid_1c_requests")
      .createCollection(collection_name);
     }
    
    if (newCollection)
      return res.status(200).send({
        Success: `таблица ${newCollection.collectionName} была успешно создана`,
      });
  }
  
  //method works 100%
  async deleteTable(req, res, collection) {
    if (!req.body.table_to_delete) return Boom.boomify(new Error("недостаточно параметров"), {statusCode:400});
    if (req.body.table_to_delete === "users")
      return Boom.boomify(new Error("naaaah удалять юзеров нельзя"), {statusCode:404});
    try {
      let deleteResult = await this.mongoNative.db("rapid_1c_requests").collection(req.body.table_to_delete).drop();
      return res.status(200).send({Success: `таблица ${req.body.table_to_delete} успешно удалена`})
    } catch (error) {
      return Boom.boomify(new Error(`Коллекции ${req.body.table_to_delete} не существует вбазе данных`), {statusCode:500});
    }
  }
  
}

