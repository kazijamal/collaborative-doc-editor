const btns = document.getElementsByClassName("cell");

const disablegrid = () => {
	for (let i = 0; i < grid.length; i++) {
		btns[i].disabled = true;
	}
}

const updategrid = (newgrid) => {
	grid = newgrid;
	for (let i = 0; i < grid.length; i++) {
		if (grid[i] == ' ') {
			btns[i].innerHTML = '_';
		} else {
			btns[i].innerHTML = grid[i];
			btns[i].disabled = true;
		}
	}
}

const makemove = (i) => {
	fetch('/ttt/play', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ move: i })
	}).then((res) => res.json())
		.then((data) => {
			updategrid(data.grid);
			const winner = data.winner;
			if (winner != ' ') {
				const winnerHTML = document.getElementById("winner");
				winnerHTML.innerHTML = `Winner is ${winner}`;
				disablegrid();
			}
		});
}

updategrid(grid);

for (let i = 0; i < grid.length; i++) {
	btns[i].onclick = function() { makemove(i) };
}
