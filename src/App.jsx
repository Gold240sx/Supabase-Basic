import React from 'react';
import Header from './components/Header';
import { useState } from 'react';
import Todos from './components/Todos';
import deleteTodo from './functions/deleteTodo';
import { supabase } from './db/supabaseClient';

function App() { 
    const [ todos, setTodos ] = useState([
        {
            id: 1,  
            title: 'Take out the trash',
        },
        {   id: 2,
            title: 'Grocery shopping',
        },
    ]);

const deleteFromSupabase = async (id) => {
    const { data, error } = await supabase
        .from('Todos')
        .delete()
        // .match({ id: id });
        .eq( "id", id );
    if (error) console.log('error', error);
    console.log('data', data);
};

const deleteTodo = (id) => {
	setTodos(todos.filter((todo) => todo.id !== id));
	// delete from the backend
	deleteFromSupabase(id);
};

  return (
		<div className='dark:bg-gray-900 h-screen w-full flex justify-center align-middle flex-col mx-auto'>
            <div className="w-80 flex mb-auto flex-col mx-auto my-auto border-2 p-3 rounded-xl border-slate-500">
                <Header />
                <Todos todos={todos} onDelete={ deleteTodo }/>
            </div>
		</div>
  );
}

export default App
