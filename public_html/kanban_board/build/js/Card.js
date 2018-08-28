//Card class
function Card(id, name) {
	var self = this;

	this.id = id;
	this.name = name || 'No name given';
	this.$element = createCard();

	function createCard() {
		//creating elements of a column
		var $card = $('<li>').addClass('card');
		var $cardDescription = $('<p>').addClass('card-description').text(self.name);
		var $cardDelete = $('<button>').addClass('btn-delete').text('x');
		var $cardRename = $('<button>').addClass('btn-rename').append('<i class="fa fa-pencil"></i>');

		//adding event
		$cardDelete.click(function() {
			self.removeCard();
		});

		$cardRename.click(function() {
			self.renameCard(prompt("Rename your card"));
		});


		//card construction
		$card.append($cardDelete).append($cardDescription).append($cardRename);

		//returning created card
		return $card;
	}
}

//adding function (removing card) to card prototype
Card.prototype = {
	removeCard: function() {
    	var self = this;
    	$.ajax({
      		url: baseUrl + '/card/' + self.id,
      		method: 'DELETE',
      		success: function(){
        		self.$element.remove();
    	  	}
    	});
    },
    renameCard: function(newName) {
    	var self = this;
    	$.ajax({
    		url: baseUrl + '/card/' + self.id,
    		method: 'PUT',
    		data: {
    			name: newName
    		},
    		success: function() {
    			self.$element.children('.column-title').text(newName);
    		}
    	});
    }
}