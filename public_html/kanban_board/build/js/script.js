$(function() {
	//creating random ID
	function randomString() {
		var chars = '0123456789abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXTZ',
			str = '';
			for (i = 0; i < 10; i++) {
				str += chars[Math.floor(Math.random() * chars.length)];
			}
		return str;
	}

	//Column class
	function Column(name) {
		var self = this; //useful for nested functions

		this.id = randomString();
		this.name = name;
		this.$element = createColumn();

		function createColumn() {
			//creating elements of a column
			var $column = $('<div>').addClass('column col-md-3');
			var $columnTitle = $('<h2>').addClass('column-title').text(self.name);
			var $columnCardList = $('<ul>').addClass('column-card-list');
			var $columnDelete = $('<button>').addClass('btn-delete').text('x');
			var $columnAddCard = $('<button>').addClass('add-card').text('Add a card');

			//adding two events
			$columnDelete.click(function() {
				self.removeColumn();
			});
				//Add a note after clicking on the button:
			$columnAddCard.click(function(card) {
				self.addCard(new Card(prompt("Enter the name of the card")));
			});

			//column construction
			$column.append($columnTitle).append($columnDelete).append($columnAddCard).append($columnCardList);

			//returning created column
			return $column;
		}
	}


	//adding two functions (1) adding card 2) removing column) to column prototype
	Column.prototype = {
		addCard: function(card) {
			this.$element.children('ul').append(card.$element);
		},
		removeColumn: function() {
			this.$element.remove();
		}
	};

	//Card class
	function Card(description) {
		var self = this;

		this.id = randomString();
		this.description = description;
		this.$element = createCard();

		function createCard() {
			//creating elements of a column
			var $card = $('<li>').addClass('card');
			var $cardDescription = $('<p>').addClass('card-description').text(self.description);
			var $cardDelete = $('<button>').addClass('btn-delete').text('x');

			//adding event
			$cardDelete.click(function() {
				self.removeCard();
			});

			//card construction
			$card.append($cardDelete).append($cardDescription);

			//returning created card
			return $card;
		}
	}

		//adding function (removing card) to card prototype
	Card.prototype = {
		removeCard: function() {
			this.$element.remove();
		}
	};

	var board = {
		name: 'Kanban Board',
		addColumn: function(column) {
			this.$element.append(column.$element);
			initSortable();
		},
		$element: $('#board .column-container')
	};

	function initSortable() {
		$('.column-card-list').sortable({
			connectWith: 'column-card-list',
			placeholder: 'card-placeholder'
		}).disableSelection();
	}

	$('.create-column').click(function() {
		var name = "_" + prompt('Enter a column name') + "_";
		var column = new Column(name);
			board.addColumn(column);
	});

	var toDoColumn = new Column('_To do_');
	var doingColumn = new Column('_Doing_');
	var doneColumn = new Column('_Done_');

	board.addColumn(toDoColumn);
	board.addColumn(doingColumn);
	board.addColumn(doneColumn);

	var card1 = new Card('New task');
	var card2 = new Card('Create kanban boards');

	toDoColumn.addCard(card1);
	doingColumn.addCard(card2);
});