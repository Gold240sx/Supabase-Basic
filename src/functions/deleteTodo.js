import { useState } from 'react';

const deleteTodo = (id) => {
    const [todos, setTodos] = useState();
    // const todos = JSON.parse(localStorage.getItem('todos')) || [];
    // localStorage.setItem('todos', JSON.stringify(todos.filter((todo) => todo.id !== id)));

	setTodos(todos.filter((todo) => todo.id !== id));
};

export default deleteTodo;