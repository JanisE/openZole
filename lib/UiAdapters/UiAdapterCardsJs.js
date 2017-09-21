function UiAdapter_CardsJs ()
{
	UiAdapter.call(this); // Superclass' constructor.

	this.aPlayers = [];
	this.iGamesPlayed = 0;

	this.aPlayerHands = [
		undefined,	// cards.Hand
		undefined,
		undefined
	];
	this.aPlayerDiscarded = [
		undefined,	// cards.Deck
		undefined,
		undefined
	];
	this.oDeck = undefined;	// cards.Deck
	this.oPot = undefined;	// cards.Hand
	this.oTrick = undefined;	// cards.Hand

	this.oGameState = undefined;	// TODO Should the UI adapter know GameState, or should it be told what to do by the Dealer instead?

	this.jqEvents = $({});
	this.pIsSetUp = new Promise((fResolve) => {this.jqEvents.on('setup_done', fResolve);});
}

UiAdapter_CardsJs.prototype = Object.create(UiAdapter.prototype);
UiAdapter_CardsJs.prototype.constructor = UiAdapter_CardsJs;

UiAdapter_CardsJs.prototype.SetUp = function UiAdapter_CardJs_SetUp ()
{
	return new Promise((fResolve) =>
	{
		// cards library becomes available when the page is ready.
		$(document).ready(() =>
		{
			cards.Hand.prototype.deal = cards.Deck.prototype.deal;
			cards.Container.prototype.clearAllCards = function ()
			{
				for (let i = this.length - 1; i >= 0; i--) {
					this.removeCard(this[i]);
				}
			};

			cards.Container.prototype.ZoleSortByStrength = function ()
			{
				[].sort.call(this, (oCardJsA, oCardJsB) =>
					-1 * Zole.ZoleSortByStrength(
						UiAdapter_CardsJs.CreateJsCardFromCardJs(oCardJsA),
						UiAdapter_CardsJs.CreateJsCardFromCardJs(oCardJsB)
					)
				);
				this.render();
			};

			//Tell the library which element to use for the table
			cards.init({
				table: '#card-table',
				cardSize: {
					width: 69,
					height: 94,
					padding: 20
				},
				cardsUrl: 'external/cards.js/img/cards.png'
			});

			this.oDeck = new cards.Deck();
			//By default it's in the middle of the container, put it slightly to the side
			this.oDeck.x += 100;

			this.aPlayerHands[0] = new cards.Hand({faceUp: true, y: 340});
			this.aPlayerHands[1] = new cards.Hand({faceUp: true, y: 60});
			this.aPlayerHands[1].x -= 150;
			this.aPlayerHands[2] = new cards.Hand({faceUp: false, y: 60});
			this.aPlayerHands[2].x += 150;

			this.oPot = new cards.Hand();

			this.oTrick = new cards.Hand({faceUp: true});

			this.aPlayerDiscarded[0] = new cards.Deck({faceUp: false, y: 340});
			this.aPlayerDiscarded[0].x -= 220;
			this.aPlayerDiscarded[1] = new cards.Deck({faceUp: false, y: 170});
			this.aPlayerDiscarded[1].x -= 220;
			this.aPlayerDiscarded[2] = new cards.Deck({faceUp: false, y: 170});
			this.aPlayerDiscarded[2].x += 220;


//			this.aPlayerHands[0].click(function (card)
//			{
//				this.oTrick.addCard(card);
//				this.oTrick.render();
//			});

			this.jqEvents.trigger('setup_done');
			fResolve();
		});
	});
};

/**
 * TODO Currently, only three players supported, which are not changing seats during a game run.
 */
UiAdapter_CardsJs.prototype.UpdatePlayerInfo = function UiAdapter_CardsJs_UpdatePlayerInfo ()
{
	return this.pIsSetUp.then(() =>
	{
		$('.player_0').text(this.aPlayers[0].GetInfo().name);
		$('.player_1').text(this.aPlayers[1].GetInfo().name);
		$('.player_2').text(this.aPlayers[2].GetInfo().name);
	});
};

UiAdapter_CardsJs.prototype.SetPlayers = function UiAdapter_CardsJs_SetPlayers (aPlayers)
{
	this.aPlayers = aPlayers;
	const self = this;

	this.pIsSetUp.then(() =>
	{
		$('<tr><th></th><th>Game mode</th>' + Array(this.aPlayers.length).fill('<th></th>').join('') + '</tr>')
		.appendTo('table.chips thead')
		.find('th:gt(1)').each(function (iCell)
		{
			$(this).text(self.aPlayers[iCell].GetInfo().name);
		});
	});

	return this.UpdatePlayerInfo();
};

/**
 * TODO Currently, only three players supported.
 * @param {Object} oGameChips
 * @return {Promise} UI updated.
 */
UiAdapter_CardsJs.prototype.AddGameChipsToResult = function UiAdapter_CardsJs_AddGameChipsToResult (oGameChips)
{
//	console.log('UiAdapter_CardsJs.AddGameChipsToResult(', JSON.stringify(oGameChips), ')');

	return this.pIsSetUp.then(() =>
	{
		const jqGameRow = $(
			'<tr><th>Game #' + (this.iGamesPlayed + 1) + '</th>'
			+ '<td class="game_mode"></td>'
			+ Array(this.aPlayers.length).fill('<td></td>').join('')
			+ '</tr>'
		)
		.appendTo('table.chips tbody');

		jqGameRow.find('.game_mode').text(this.oGameState.sGameMode);
		const jqGameChips = jqGameRow.find('td:gt(0)');

		for (const sPlayer in oGameChips) {
			if (sPlayer in this.oPlayerOrder) {
				jqGameChips.eq(this.oPlayerOrder[sPlayer]).text(oGameChips[sPlayer]);
			}
			else {
				console.error('Chips for unexpected player: ', sPlayer, oGameChips, this.oPlayerOrder);
			}
		}

		this.iGamesPlayed++;
	});
};

UiAdapter_CardsJs.prototype.DisplayGameRunTotals = function UiAdapter_CardsJs_DisplayGameRunTotals (oGameRunTotals)
{
//	console.log('UiAdapter_CardsJs.DisplayGameRunTotals(', JSON.stringify(oGameRunTotals), ')');

	return this.pIsSetUp.then(() =>
	{
		const jqGameChips = $(
			'<tr><th>Total</th><th></th>' + Array(this.aPlayers.length).fill('<td></td>').join('') + '</tr>'
		)
		.appendTo('table.chips tbody')
		.find('td');

		for (const iPlayer in oGameRunTotals.aPlayerTotals) {
			jqGameChips.eq(iPlayer).text(oGameRunTotals.aPlayerTotals[iPlayer].chips);
		}

		this.iGamesPlayed++;
	});
};

/**
 * TODO Currently, only three players supported.
 * @param oPlayerOrder
 */
UiAdapter_CardsJs.prototype.SetPlayerOrder = function Dealer_SetPlayerOrder (oPlayerOrder)
{
	this.oPlayerOrder = oPlayerOrder;

	// Should this actually be in some "SetUpBeforeEachGame" instead?
	this.UpdatePlayerInfo();
};

/**
 *
 * @param {JsCard} oJsCard
 * @return {cards.Card}
 */
UiAdapter_CardsJs.CreateCardJsFromJsCard = function UiAdapter_CardsJs_CardJsFromJsCard (oJsCard)
{
	let sSuit = undefined;
	let iRank = undefined;

	if (! oJsCard.IsKnown()) {
		// Keep the default unknown values.
	}
	else {
		let sFirstSuiteCard = undefined;

		switch (oJsCard.GetSuit()) {
		case '♠':
			sSuit = 's';
			sFirstSuiteCard = '🂡';
			break;
		case '♥':
			sSuit = 'h';
			sFirstSuiteCard = '🂱';
			break;
		case '♦':
			sSuit = 'd';
			sFirstSuiteCard = '🃁';
			break;
		case '♣':
			sSuit = 'c';
			sFirstSuiteCard = '🃑';
			break;
		default:
			// Unknown card.
			console.error('Known but unexpected card? ', oJsCard);
		}

		if (sFirstSuiteCard) {
			iRank = oJsCard.sCard.codePointAt(0) - sFirstSuiteCard.codePointAt(0) + 1;
			if (iRank > 11) {
				iRank--;	// Account for the knight card (12th card in a suit), which does not exist in cards.js.
			}
		}
		// Else: it's some kind of error reported by the console.error above.
		// 		Wouldn't need this "if", if the error was thrown?
	}

//	console.log('CreateCardJsFromJsCard(', oJsCard.sCard, ') => ', sSuit, iRank);
	return new cards.Card(sSuit, iRank);
};

/**
 * Converts Card object of card.js into JsCard.
 * @param {cards.Card} oCard
 * @return {JsCard}
 */
UiAdapter_CardsJs.CreateJsCardFromCardJs = function UiAdapter_CardsJs_CreateJsCardFromCardJs (oCard)
{
	const oJsCard = new JsCard(undefined);

	if (! oCard.suit || ! oCard.rank) {
		console.log('CreateJsCardFromCardJs: Card did not have expected properties: ', oCard);
		return oJsCard;
	}

	let sFirstSuiteCard = '';

	switch (oCard.suit) {
	case 's':
		sFirstSuiteCard = '🂡';
		break;
	case 'h':
		sFirstSuiteCard = '🂱';
		break;
	case 'd':
		sFirstSuiteCard = '🃁';
		break;
	case 'c':
		sFirstSuiteCard = '🃑';
		break;
	default:
		return oJsCard;
	}

	oJsCard.sCard = String.fromCodePoint(sFirstSuiteCard.codePointAt(0) - 1
		+ (oCard.rank == 14
				? 1	// Ace may be 1 or 14.
				: (oCard.rank
					+ (oCard.rank <= 11
						? 0
						: 1	// Account for the knight card (12th card in a suit), which does not exist in cards.js.
					)
				)
		)
	);

	return oJsCard;
};

/**
 * @param {JsCard} oCard
 * @param {cards.Container} oContainer
 */
UiAdapter_CardsJs.FindCardInContainer = function (oJsCard, oContainer)
{
	for (const oCard of oContainer) {
		if (UiAdapter_CardsJs.CreateJsCardFromCardJs(oCard).sCard == oJsCard.sCard) {
			return oCard;
		}
	}
};

UiAdapter_CardsJs.prototype.ClearCardsFromTable = function UiAdapter_CardsJs_ClearCardsFromTable ()
{
	this.oDeck.clearAllCards();
	this.aPlayerDiscarded[0].clearAllCards();
	this.aPlayerDiscarded[1].clearAllCards();
	this.aPlayerDiscarded[2].clearAllCards();

	// In case of "pule", all cards are still in hand:
	this.aPlayerHands[0].clearAllCards();
	this.aPlayerHands[1].clearAllCards();
	this.aPlayerHands[2].clearAllCards();
	this.oPot.clearAllCards();
};

/**
 * @param {JsCard[]} aDeck
 * @return {Promise}
 */
UiAdapter_CardsJs.prototype.SetDeck = function CardJs_SetDeck (aDeck)
{
	return new Promise((fResolve) =>
	{
		this.ClearCardsFromTable();

		this.oGameState = new GameState(aDeck);

		this.pIsSetUp
		.then(() =>
		{
			const aCards = [];
			for (const oCard of aDeck) {
				aCards.unshift(UiAdapter_CardsJs.CreateCardJsFromJsCard(oCard));
			}

			this.oDeck.addCards(aCards);

			//No animation here, just get the deck onto the table.
			this.oDeck.render({immediate: true});

			fResolve();
		});
	});
};

UiAdapter_CardsJs.prototype.MoveTrickToDiscarded = function CardJs_MoveTrickToDiscarded (sPlayer)
{
	return new Promise((fResolve) =>
	{
		const aCards = [];
		for (const oCard of this.oTrick) {
			aCards.push(oCard);
		}
		for (const oCard of aCards) {
			this.aPlayerDiscarded[this.oPlayerOrder[sPlayer]].addCard(oCard);
		}

		this.aPlayerDiscarded[this.oPlayerOrder[sPlayer]].render({speed: 300, callback: fResolve});
	});
};

UiAdapter_CardsJs.prototype.OnStateChange = function CardJs_OnStateChange (oLogEntry)
{
//	console.log('UiAdapter_CardsJs.OnStateChange: ', JSON.stringify(oLogEntry));

	try {
		this.oGameState.DoActionByLogEntry(oLogEntry);
	}
	catch (oException) {
		console.error('UiAdapter_CardsJs complains: ', oException);
	}

	return new Promise((fResolve) =>
	{
		switch (oLogEntry.action) {
		case 'deal':
			this.oDeck.deal(1, [this.aPlayerHands[this.oPlayerOrder[oLogEntry.data.player]]], 200, fResolve);
			break;

		case 'to_pot':
			this.oDeck.deal(1, [this.oPot], 200, fResolve);
			break;

		case 'mode':
			switch (oLogEntry.data.mode) {
			case 'zole':
				for (const oCard of this.oGameState.oPot) {
					this.aPlayerDiscarded[this.oPlayerOrder[GameState.GetNextPlayer(oLogEntry.data.player)]].addCard(
						UiAdapter_CardsJs.FindCardInContainer(oCard, this.oPot)
					);
				}
				this.aPlayerDiscarded[this.oPlayerOrder[GameState.GetNextPlayer(oLogEntry.data.player)]].render({speed: 300, callback: fResolve});
				break;

			case 'augšā':
				this.oPot.deal(2, [this.aPlayerHands[this.oPlayerOrder[oLogEntry.data.player]]], 200, fResolve);
				break;

			case 'galdiņš':
			case 'mazā zole':
				this.oPot.deal(2, [this.oDeck], 200, fResolve);
				break;

			case 'pule':
				// TODO Mark/display pule!
				fResolve();
				break;

			default:
				console.error('Unexpected game mode: ', oLogEntry);
			}

			setTimeout(() => {
				// Sort one player's cards, just so we can see we can do it.
				this.aPlayerHands[0].ZoleSortByStrength();
			}, 500);
			break;

		case 'skip':
			// Nothing, for now.
			fResolve();
			break;

		case 'discard':
			this.aPlayerDiscarded[this.oPlayerOrder[oLogEntry.data.player]].addCard(
				UiAdapter_CardsJs.FindCardInContainer(new JsCard(oLogEntry.data.card), this.aPlayerHands[this.oPlayerOrder[oLogEntry.data.player]])
			);
			this.aPlayerDiscarded[this.oPlayerOrder[oLogEntry.data.player]].render({callback: fResolve});
			break;

		case 'play':
			this.oTrick.addCard(
				UiAdapter_CardsJs.FindCardInContainer(new JsCard(oLogEntry.data.card), this.aPlayerHands[this.oPlayerOrder[oLogEntry.data.player]])
			);
			this.oTrick.render({speed: 400, callback: fResolve});
			break;

		default:
			console.error('UiAdapter_CardsJs.OnStateChange: Unexpected action: ', oLogEntry);
		}

//				this.oDeck.deal(4, [oPlayerA, oPlayerB, oPlayerC], 200, function ()
//				{
//					//		discardPile.addCard(this.oDeck.topCard());
//					//		discardPile.render();
//				});
	});
};
