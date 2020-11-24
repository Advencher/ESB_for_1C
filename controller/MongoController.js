import Boom from "boom";
import isEmptyObject, { dataTypeChecker } from "../utils/DataTypeChecker.js";

export class MongoController {
  constructor(mongoNative) {
    this.mongoNative = mongoNative;
    this.chageTableProperties = this.chageTableProperties.bind(this);
    this.queryData = this.queryData.bind(this);
  }

  async chageTableProperties(req, res, next) {
    if (!req.query.collection)
      return Boom.boomify(
        new Error("collection не указан в url в качестве параметра"),
        { statusCode: 400 }
      );

    let collection;
    try {
      collection = this.mongoNative.model(req.query.collection);
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
        return await this.createTable(req, res, collection);
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
    const collection = this.mongoNative.model(req.query.collection);
    if (!collection)
      return Boom.boomify(
        new Error(`не найдена коллекция с именем <${req.query.collection}>`),
        { statusCode: 404 }
      );
    let query = {},
      projection = {};
    let check =
      req.query.collection === "User"
        ? res.status(500).send({
            statusCode: 500,
            message: "Not gonna give you all the users :)",
          })
        : (projection = { _id: 0, __v: 0 });
    if (req.query.select) {
      query = req.query.select;
    }
    if (req.query.projection) {
      projection = { ...JSON.parse(req.query.projection), ...projection };
    }

    const queryResult = await collection
      .find(query, projection)
      .lean()
      .exec(function (err, doc) {
        if (err) {
          return Boom.boomify(err, {
            message: "ошибка во время запроса (╯°□°）╯︵ ┻━┻",
          });
        }
        return res.status(200).send(JSON.stringify(doc));
      });
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
          addNewField = await collection.schema.add({
            [req.body.new_key]: "String",
          });
          break;

        case "Array":

          // addNewField = await collection.schema.add({
          //    [req.body.new_key]: "Array",
          // });
          await collection.updateMany(
            {}, 
            {[req.body.new_key] : [] },
            {multi:true, strict: false}, 
              function(err, numberAffected){  
            });
          break;

        case "Object":
          addNewField = await collection.schema.add({
            [req.body.new_key]: "Object",
          });
          break;

        case "Number":
          addNewField = await collection.schema.add({
            [req.body.new_key]: "Number",
          });
          break;

        default:
          return Boom.badRequest("Только Array, Object, Number или String");
      }
    } catch (err) {
      return Boom.boomify(err, {
        message:
          "при добавлении поля произошла ошибка, возможно поле с такм именем уже существует",
      });
    }

    return res
      .status(200)
      .send(
        { Success: `Поле с именем <${req.body.new_key}> успешно добавлено`,
        CollectionName: `${collection.modelName}`,
        NewStructure: `${JSON.stringify(collection.schema.paths)}`}
      );
  }

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
        return res.status(200).send(
         { 
            Success: `Поле с именем <${req.body.remove_key}> успешно удалено из таблицы`,
            CollectionName: `${collection.prototype.modelName}`,
            NewStructure: `${collection.prototype.paths}`,
            DocumentsChanged: `${resultRemove.modifiedCount}`
          }
        );
      } else
        return res.status(200).send({
      Failure: `в таблице с именем <${collection.prototype.modelName}> не существует поля <${req.query.remove_key}>`
    });
    } catch (err) {
      return Boom.boomify(err, {
        statusCode: 404,
        message: "Ошибка при изменении таблицы",
      });
    }
  }

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
      let old_keys = collection.schema.paths;
      const updateResult = collection.updateMany(
        {},
        { $rename: [req.body.query_object] }
      );
      return res
        .status(200)
        .send(JSON.stringify([old_keys, collection.schema.paths]));
    } catch (err) {
      return Boom.boomify(err, {
        statusCode: 500,
        message: "ошибка во время переименования поля(ей)",
      });
    }
  }

 
}
