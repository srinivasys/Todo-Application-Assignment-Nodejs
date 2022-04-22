const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
const isValid = require("date-fns/isValid");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const validStatus = ["TO DO", "IN PROGRESS", "DONE"];
const validPriority = ["HIGH", "MEDIUM", "LOW"];
const validCategory = ["WORK", "HOME", "LEARNING"];

const initializingServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server started at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializingServerAndDb();

const hasBothPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityOnly = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusOnly = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryOnly = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//API 1 DONE
app.get("/todos/", async (request, response) => {
  let todo = null;
  let filterTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasBothPriorityAndStatus(request.query):
      if (validPriority.includes(priority) && validStatus.includes(status)) {
        filterTodoQuery = `
      SELECT
        id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      } else if (validPriority.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (validStatus.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriorityAndCategory(request.query):
      if (
        validPriority.includes(priority) &&
        validCategory.includes(category)
      ) {
        filterTodoQuery = `
      SELECT
        id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
      } else if (validPriority.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (validCategory.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasStatusAndCategory(request.query):
      if (validStatus.includes(status) && validCategory.includes(category)) {
        filterTodoQuery = `
            SELECT
                id, todo, priority, status, category, due_date AS dueDate
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND category = '${category}';`;
      } else if (validStatus.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (validCategory.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityOnly(request.query):
      if (validPriority.includes(priority)) {
        filterTodoQuery = `
            SELECT
                id, todo, priority, status, category, due_date AS dueDate
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusOnly(request.query):
      if (validStatus.includes(status)) {
        filterTodoQuery = `
        SELECT
            id, todo, priority, status, category, due_date AS dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryOnly(request.query):
      if (validCategory.includes(category)) {
        filterTodoQuery = `
            SELECT
                id, todo, priority, status, category, due_date AS dueDate
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      filterTodoQuery = `
      SELECT
        id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  if (filterTodoQuery !== "") {
    todo = await db.all(filterTodoQuery);
    response.send(todo);
  }
});

//API 2 DONE
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const uniqueTodoQuery = `
    SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo WHERE id = '${todoId}';`;
  const todo = await db.get(uniqueTodoQuery);
  response.send(todo);
});

//API 3 DONE
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const validDate = isValid(new Date(date), "yyyy-MM-dd");
  if (validDate) {
    const actualDate = format(new Date(date), "yyyy-MM-dd");
    const agendaQuery = `
    SELECT id, todo, priority, status, category, due_date AS dueDate
    FROM todo 
    WHERE due_date = '${actualDate}';`;
    const agenda = await db.all(agendaQuery);
    response.status(200);
    response.send(agenda);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4 DONE
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const validDate = isValid(new Date(dueDate), "yyyy-MM-dd");

  if (validCategory.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (validPriority.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (validStatus.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (validDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const date = format(new Date(dueDate), "yyyy-MM-dd");
    const postTodoQuery = `
    INSERT INTO todo (id, todo, priority, status, category, due_date)
    VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${date}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//API 5 DONE
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateTodoColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      if (validStatus.includes(requestBody.status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        updateTodoColumn = "Status";
      }
      break;

    case requestBody.priority !== undefined:
      if (validPriority.includes(requestBody.priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        updateTodoColumn = "Priority";
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      if (validCategory.includes(requestBody.category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        updateTodoColumn = "Category";
      }
      break;
    case requestBody.dueDate !== undefined:
      const validDate = isValid(new Date(requestBody.dueDate), "yyyy-MM-dd");
      if (validDate === false) {
        response.status(400);
        response.send("Invalid Due Date");
      } else {
        updateTodoColumn = "Due Date";
      }
      break;
  }
  if (updateTodoColumn !== "") {
    const oldTodoQuery = `
  SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo WHERE id = ${todoId};`;
    const oldTodo = await db.get(oldTodoQuery);

    const {
      id = oldTodo.id,
      todo = oldTodo.todo,
      status = oldTodo.status,
      priority = oldTodo.priority,
      category = oldTodo.category,
      dueDate = oldTodo.due_date,
    } = request.body;
    const updateTodoQuery = `
  UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}'
  WHERE id = ${id};`;
    await db.run(updateTodoQuery);
    response.send(`${updateTodoColumn} Updated`);
  }
});

//API 6 DONE
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
