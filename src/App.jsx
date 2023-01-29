import React from 'react';
import Header from './components/Header';
import { useState, useEffect } from 'react';
import Todos from './components/Todos';
import { supabase } from './db/supabaseClient';

function App() { 
    const [todos, setTodos] = useState([]);

    useEffect(() => {
        const getTodos = async () => {
			// signup(email, password);
            await signIn();
			const allTodos = await fetchTodos();
			setTodos(allTodos); // populate the react state;
		}
        getTodos()
    }, [])

    // Defaults for testing
    const email = "240designworks@gmail.com";
    const password = "password";

    const signup = async (email, password) => {
        const { user,  error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) console.log('error', error);
    };

    const signIn = async () => {
        const { user, error } = await supabase.auth.signInWithPassword({
			email: "240designworks@gmail.com",
			password: "password",
		});
        if (error) {console.log('error', error)} else {console.log('Signed In as:', user)}
    };



    const fetchTodos = async () => {
        let { data: Todos, error } = await supabase
            .from('Todos')
            .select('*')
            .order('id', { ascending: true })
        if (error) console.log('error', error);
        return Todos;
    };

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
