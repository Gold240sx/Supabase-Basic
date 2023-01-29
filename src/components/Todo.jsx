const Todo = ({ todo, onDelete }) => {
	return (
		<div className= "h-fit flex text-slate-400 my-2 p-1 rounded-full w-full bg-slate-800">
			<h3 className="leading-loose pl-3">{todo.title}</h3>
			<button
				className="text-white cursor-pointer w-[32px] border rounded-full p-1 py-[4px] hover:bg-slate-600 ml-auto"
				onClick={() => {
					onDelete(todo.id);
				}}>
				X
			</button>
		</div>
	);
};

export default Todo;
