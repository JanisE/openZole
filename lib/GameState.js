//let JsCard = this.JsCard;
//if (! JsCard) {
//	JsCard = require('../lib/JsCard.js').JsCard;
//}
//
//let CardSet = this.CardSet;
//if (! CardSet) {
//	CardSet = require('../lib/CardSet.js').CardSet;
//}

/**
 * Zole (not a generic) game state.
 * @param {Array} aDeck A list of cards.
 * @constructor
 */
function GameState (aDeck)
{
	this.oEvents = $({});

	// If "new" missing, fix it.
	if (! (this instanceof GameState)) {
		return new GameState(aDeck);
	}

	// History of the game actions defining the game.
	this.aGameLog = [];

	// Helper/utility/cached game state data.
	this.aDeck = undefined;	// list of cards,
	this.sGameMode = undefined;	// undefined => 'augšā' | 'zole' | 'mazā zole' | 'galdiņš' | 'pule'.
	this.sGameModeBy = undefined;	// By which player: undefined => undefined | 'A' | 'B' | 'C'

	this.oPot = new CardSet();
	this.oDiscardedCards = new CardSet();
	this.oHands = {
		A: new CardSet(),
		B: new CardSet(),
		C: new CardSet()
	};
	this.oPlayedCards = {
		A: [],	// list of cards,
		B: [],	// list of cards,
		C: []	// list of cards,
	};
	this.aLastTrick = [];	// A list of 0-3 playing actions {player: String, card: {JsCard}}.

	this.oStats = {
		A: {points: 0, tricks: 0},
		B: {points: 0, tricks: 0},
		C: {points: 0, tricks: 0},
		pot: {points: 0}	// This gets filled only in the case of game mode 'zole'.
	};

	this.SetDeck(aDeck);
}

GameState.prototype.On = function GameState_On (sEvent, fHandler)
{
	if (sEvent != 'state_change') {
		console.error('Unexpected event: ', sEvent);
	}

	this.oEvents.on(sEvent, fHandler);
};

GameState.prototype.Off = function GameState_On (sEvent, fHandler)
{
	this.oEvents.off(sEvent, fHandler);
};

//
// Exceptions.
//

/**
 * @param mDetails
 * @constructor
 */
GameState.InvalidInputException = function GameState_InvalidInputException (mDetails)
{
	Error.call(this); // Superclass' constructor.

	this.sType = 'GameState_InvalidInputException';
	this.mDetails = mDetails;

	console.error('GameState exception: ', this.sType, this.mDetails);
	console.trace();
};
GameState.InvalidInputException.prototype = Object.create(Error.prototype);
GameState.InvalidInputException.prototype.constructor = GameState.InvalidInputException;

/**
 * @param mDetails
 * @constructor
 */
GameState.ConsistencyException = function GameState_ConsistencyException (mDetails)
{
	Error.call(this); // Superclass' constructor.

	this.sType = 'GameState_ConsistencyException';
	this.mDetails = mDetails;

//	this.name = 'MyError';
//	this.message = message || 'Default Message';
//	this.stack = (new Error()).stack;

	console.error('GameState exception: ', this.sType, this.mDetails);
	console.trace();
};
GameState.ConsistencyException.prototype = Object.create(Error.prototype);
GameState.ConsistencyException.prototype.constructor = GameState.ConsistencyException;

/**
 * @param mDetails
 * @constructor
 */
GameState.GameRulesException = function GameState_GameRulesException (mDetails)
{
	Error.call(this); // Superclass' constructor.

	this.sType = 'GameState_GameRulesException';
	this.mDetails = mDetails;

	console.error('GameState exception: ', this.sType, this.mDetails);
	console.trace();
};
GameState.GameRulesException.prototype = Object.create(Error.prototype);
GameState.GameRulesException.prototype.constructor = GameState.GameRulesException;

//
// Internals.
//

/**
 * TODO Do we want to allow the caller to determine the time?
 * @param {Object} oAction
 */
GameState.prototype.AddToGameLog = function GameState_AddToGameLog (oAction)
{
	const oEntry = _.cloneDeep(oAction);
	oEntry.time = new Date().getTime();

	this.aGameLog.push(oEntry);

	this.oEvents.trigger('state_change', _.cloneDeep(oEntry));

	return _.cloneDeep(oEntry);
};

/**
 * @param {String} sPlayer: 'A', 'B', or 'C'.
 * @returns {String|undefined}
 */
GameState.GetNextPlayer = function GameState_GetNextPlayer (sPlayer)
{
	let sNext = undefined;

	switch (sPlayer) {
	case 'A':
		sNext = 'B';
		break;
	case 'B':
		sNext = 'C';
		break;
	case 'C':
		sNext = 'A';
		break;
	}

	return sNext;
};

/**
 * @param {Object[]} aTrick
 * @param {String} aTrick[].card
 * @param {String} aTrick[].player
 * @return {String}
 */
GameState.GetTrickTaker = function GameState_GetTrickTaker (aTrick)
{
	if (aTrick.length != 3) {
		throw new GameState.GameRulesException(
			['GetTrickTaker: A trick can be taken only when all three players have played.', aTrick]
		);
	}

	const sRequestedSuit = aTrick[0].card.GetSuit();

	const aSortedEligibleTakerCards = aTrick
		// Filter cards that are not played to "atmesties", as those would never take the trick.
		.filter(function (oAction)
		{
			return oAction.card.GetSuit() == sRequestedSuit || IsZoleTrumpCard(oAction.card);
		})
		// And then we can apply the global sorting, out of the context of the trick / suits.
		.sort(function (oActionA, oActionB)
		{
			return CardToStrengthIndex(oActionA.card) - CardToStrengthIndex(oActionB.card);
		});

	return aSortedEligibleTakerCards.pop().player;
};

/**
 * @param {JsCard} oLeadingCard Leading card of the current trick.
 * @param {CardSet} oHand Player's hand whose allowed responses we want to know.
 * @return {CardSet}
 */
GameState.GetAllowedResponses = function GameState_GetAllowedResponses (oLeadingCard, oHand)
{
	let oAllowedCards = new CardSet();

	if (IsZoleTrumpCard(oLeadingCard)) {
		oAllowedCards = SelectCards(oHand, IsZoleTrumpCard);
	}
	else {
		let sRequestedSuit = oLeadingCard.GetSuit();
		oAllowedCards = SelectCards(oHand, function (oCard)
		{
			return oCard.GetSuit() == sRequestedSuit && ! IsZoleTrumpCard(oCard);
		});
	}

	// If no requested card present, any card is allowed.
	if (oAllowedCards.Size() <= 0) {
		oAllowedCards = new CardSet([... oHand]);
	}

//	console.log('GetAllowedResponses: Returns: ', oAllowedCards);
	return oAllowedCards;
};

//test.assert.equal(GameState.GetAllowedResponses(new JsCard('🂱'), new Set(['🂮', '🂺'])), new Set(['🂺']));
//test.assert.equal(GameState.GetAllowedResponses(new JsCard('🂱'), new Set(['🂽', '🂺'])), new Set(['🂺']));

//
// Assertions for validating input.
//

GameState.prototype.AssertCardIsValid = function AssertCardIsValid (oCard)
{
	if (! JsCard.IsValidCard(oCard)) {
		throw new GameState.InvalidInputException(['AssertCardIsValid: Invalid card: ', oCard]);
	}

	if (oCard.IsKnown() && ! IsValidZoleCard(oCard)) {
		throw new GameState.GameRulesException(['AssertCardIsValid: Invalid zole card: ', oCard]);
	}
};

GameState.prototype.AssertPlayerIsValid = function AssertPlayerIsValid (sPlayer)
{
	if (sPlayer != 'A' && sPlayer != 'B' && sPlayer != 'C') {
		throw new GameState.InvalidInputException(['AssertPlayerIsValid: Invalid player: ', sPlayer]);
	}
};

/**
 * @param {String} sPlayer
 * TODO Duplicates AssertPlayerMayApplyGameModeAction, only more constructive output(but more general debug output)?
 * @return {Set}
 */
GameState.prototype.GetAllowedApplyGameModeActions = function GameState_GetAllowedApplyGameModeActions ()
{
	const oAllowedActions = new Set();

	if (this.sGameMode) {
		// Mode ir already set.
	}
	else if (this.aGameLog.length < 1) {
		// Deck is not prepared yet?
		console.error('Deck not prepared?');
	}
	else if (this.aDeck.length > 0) {
		// Cards not dealt yet.
	}
	else if (! _.includes(['deal', 'to_pot', 'skip'], this.aGameLog[this.aGameLog.length - 1].action)) {
		// Already playing?
	}
	else {
		if (_.includes(['deal', 'to_pot'], this.aGameLog[this.aGameLog.length - 1].action)) {
//			oAllowedActions.add({action: 'mode', data: {mode: 'mazā zole', player: 'A'}});
//			oAllowedActions.add({action: 'mode', data: {mode: 'mazā zole', player: 'B'}});
//			oAllowedActions.add({action: 'mode', data: {mode: 'mazā zole', player: 'C'}});

			oAllowedActions.add({action: 'mode', data: {mode: 'augšā', player: 'A'}});
			oAllowedActions.add({action: 'mode', data: {mode: 'zole', player: 'A'}});
			oAllowedActions.add({action: 'mode', data: {mode: 'mazā zole', player: 'A'}});
			oAllowedActions.add({action: 'skip', data: {player: 'A'}});
		}
		else if (this.aGameLog[this.aGameLog.length - 1].action == 'skip') {
			if (this.aGameLog[this.aGameLog.length - 1].data.player == 'A') {
				oAllowedActions.add({action: 'mode', data: {mode: 'augšā', player: 'B'}});
				oAllowedActions.add({action: 'mode', data: {mode: 'zole', player: 'B'}});
				oAllowedActions.add({action: 'mode', data: {mode: 'mazā zole', player: 'B'}});
				oAllowedActions.add({action: 'skip', data: {player: 'B'}});
			}
			else if (this.aGameLog[this.aGameLog.length - 1].data.player == 'B') {
				oAllowedActions.add({action: 'mode', data: {mode: 'augšā', player: 'C'}});
				oAllowedActions.add({action: 'mode', data: {mode: 'zole', player: 'C'}});
				oAllowedActions.add({action: 'mode', data: {mode: 'mazā zole', player: 'C'}});
				oAllowedActions.add({action: 'skip', data: {player: 'C'}});
			}
			else {
				oAllowedActions.add({action: 'mode', data: {mode: 'galdiņš'}});
				oAllowedActions.add({action: 'mode', data: {mode: 'pule'}});
			}
		}
		else {
			console.error('Unexpected previous action: ', this.aGameLog[this.aGameLog.length - 1].action);
		}
	}

	return oAllowedActions;
};

/**
 * @param {String} sPlayer
 * TODO Duplicates GetAllowedApplyGameModeActions, only with more helpful error messages?
 */
GameState.prototype.AssertPlayerMayApplyGameModeAction = function AssertPlayerMayApplyGameModeAction (sPlayer)
{
	if (this.sGameMode) {
		throw new GameState.GameRulesException(['SkipChoosingGameMode: Mode ir already set: ', this.sGameMode, sPlayer]);
	}

	if (
		this.aGameLog.length < 1
		|| this.aDeck.length > 0
		|| sPlayer == 'A' && !_.includes(['deal', 'to_pot'], this.aGameLog[this.aGameLog.length - 1].action)
	) {
		throw new GameState.GameRulesException([
			'AssertPlayerMayApplyGameModeAction: Not the appropriate time for choosing the game mode.',
			this.aGameLog.length,
			this.aGameLog.length > 0 ? this.aGameLog[this.aGameLog.length - 1] : undefined
		]);
	}

	if (
		sPlayer != 'A'
		&& (
			this.aGameLog[this.aGameLog.length - 1].action != 'skip'
			// Player B may choose the game mode only right after player A has skipped choosing it.
			|| sPlayer == 'B' && this.aGameLog[this.aGameLog.length - 1].data.player != 'A'
			// Player C may choose the game mode only right after player B has skipped choosing it.
			// 	(At this point, sPlayer may be only 'C', but adding the condition for clarity's sake.)
			|| sPlayer == 'C' && this.aGameLog[this.aGameLog.length - 1].data.player != 'B'
		)
	) {
		throw new GameState.GameRulesException([
			'AssertPlayerMayApplyGameModeAction: Not the appropriate time for choosing the game mode for player ',
			sPlayer,
			this.aGameLog.length,
			this.aGameLog.length > 0 ? this.aGameLog[this.aGameLog.length - 1] : undefined
		]);
	}
};


GameState.prototype.ExportLog = function GameState_ExportLog ()
{
	return _.cloneDeep(this.aGameLog);
};

/**
 * @return {Set}
 */
GameState.prototype.GetAllowedActions = function GameState_GetAllowedActions ()
{
	// TODO Add allowed actions of the early stage.
	const oActions = new Set([
		... this.GetAllowedApplyGameModeActions(),
		... this.GetAllowedDiscardCardActions(),
		... this.GetAllowedPlayCardActions()
	]);

//	console.log('GetAllowedActions: Returns: ', oActions);
	return oActions;
};

// TODO Do we really need this?
//GameState.prototype.GetAllowedNextActions = function GetAllowedNextActions ()
//{
//	const oAllowedActions = new Set();
//
//	// TODO How to determine a missing deck at the beginning? What to do in those cases? undefined vs []
//	if (this.aDeck.length > 0) {
//		for (let i = this.aDeck.length - 1; i > 0; i--) {
//			if (this.oHands.A.size < 8) {
//				oAllowedActions.add({
//					action: 'deal',
//					data: {
//						player: 'A',
//						card: this.aDeck[i].sCard
//					}
//				});
//			}
//			if (this.oHands.B.size < 8) {
//				oAllowedActions.add({
//					action: 'deal',
//					data: {
//						player: 'A',
//						card: this.aDeck[i].sCard
//					}
//				});
//			}
//			if (this.oHands.C.size < 8) {
//				oAllowedActions.add({
//					action: 'deal',
//					data: {
//						player: 'A',
//						card: this.aDeck[i].sCard
//					}
//				});
//			}
//			if (this.oPot.Size() < 2) {
//				oAllowedActions.add({
//					action: 'to_pot',
//					data: {
//						card: this.aDeck[i].sCard
//					}
//				});
//			}
//		}
//	}
//
//	// All the other actions?...
//
//	return oAllowedActions;
//};

//
// Actions (private).
//

GameState.prototype.SetDeck = function GameState_SetDeck (aCards)
{
	if (this.aDeck != undefined) {
		throw new GameState.ConsistencyException(['SetDeck: The deck is already set to: ', this.aDeck]);
	}

	//
	// Check if the input is allowed.
	//

	const oUniqueCards = new CardSet();	// All unknown cards are considered as different.

	for (const oCard of aCards)	{
		this.AssertCardIsValid(oCard);
		oUniqueCards.Add(oCard);
	}

	if (oUniqueCards.Size() != aZoleStrength.length) {
		throw new GameState.GameRulesException(['SetDeck: The deck does not consist of all zole cards: ', aCards]);
	}

	//
	// Log and update the cached state.
	//

	this.AddToGameLog({
		action: 'deck',
		data: _.flatMap(aCards, function (oCard) {return oCard.sCard;})
	});

	this.aDeck = aCards;
};

//
// Actions (public).
//

GameState.prototype.DoActionByLogEntry = function GameState_DoActionByLogEntry (oEntry)
{
	let oFinalLogEntry = null;

	switch (oEntry.action) {
		case 'deal':
			oFinalLogEntry = this.DealCard(oEntry.data.player, new JsCard(oEntry.data.card));
			break;
		case 'discard':
			oFinalLogEntry = this.DiscardCard(oEntry.data.player, new JsCard(oEntry.data.card));
			break;
		case 'mode':
			if ('player' in oEntry.data) {
				oFinalLogEntry = this.ChooseGameMode(
					oEntry.data.player,
					oEntry.data.mode,
					'cards' in oEntry.data
						? new CardSet(ConstructJsCards(oEntry.data.cards))
						: undefined
				);
			}
			else {
				oFinalLogEntry = this.AgreeOnGameMode(oEntry.data.mode);
			}
			break;
		case 'play':
			oFinalLogEntry = this.PlayCard(oEntry.data.player, new JsCard(oEntry.data.card));
			break;
		case 'skip':
			oFinalLogEntry = this.SkipChoosingGameMode(oEntry.data.player);
			break;
		case 'to_pot':
			oFinalLogEntry = this.DealCardToPot(new JsCard(oEntry.data.card));
			break;
		default:
			throw new GameState.InvalidInputException(['DoActionByLogEntry: Invalid action: ', oEntry]);
	}

	return oFinalLogEntry;
};

/**
 *
 * @param {String} sPlayer A|B|C
 * @param {JsCard} oCard
 */
GameState.prototype.DealCard = function DealCard (sPlayer, oCard)
{
	// Check.
	this.AssertPlayerIsValid(sPlayer);
	this.AssertCardIsValid(oCard);

	if (this.aDeck[0].sCard != undefined && (this.aDeck.length <= 0 || this.aDeck[0].sCard != oCard.sCard)) {
		throw new GameState.GameRulesException(['DealCard: Card not dealt from the deck.', oCard, this.aDeck[0]]);
	}

	// Update the derived info.
	if (this.aDeck != undefined) {
		this.aDeck.shift();
	}
	// Else: the deck is not known?

	this.oHands[sPlayer].Add(oCard);

	// Confirm into the log.
	return this.AddToGameLog({
		action: 'deal',
		data: {
			player: sPlayer,
			card: oCard.sCard
		}
	});
};

GameState.prototype.DealCardToPot = function DealCardToPot (oCard)
{
	// Check.
	this.AssertCardIsValid(oCard);

	if (this.aDeck == undefined || this.aDeck.length <= 0 || this.aDeck[0].sCard != oCard.sCard) {
		throw new GameState.GameRulesException(['DealCardToPot: Card not dealt from the deck.']);
	}

	// Update the derived info.
	this.aDeck.shift();
	this.oPot.Add(oCard);

	// Confirm into the log.
	return this.AddToGameLog({
		action: 'to_pot',
		data: {
			card: oCard.sCard
		}
	});
};

GameState.prototype.SkipChoosingGameMode = function SkipChoosingGameMode (sPlayer)
{
	// Check.
	this.AssertPlayerIsValid(sPlayer);
	this.AssertPlayerMayApplyGameModeAction(sPlayer);

	// Confirm into the log.
	return this.AddToGameLog({
		action: 'skip',
		data: {
			player: sPlayer
		}
	});
};

/**
 * @param {String} sPlayer
 * @param {String} sMode augšā|zole|mazā zole
 */
GameState.prototype.ChooseGameMode = function ChooseGameMode (sPlayer, sMode, oRevealedPotCards)
{
	// Check.
	if (sMode != 'augšā' && sMode != 'zole' && sMode != 'mazā zole') {
		throw new GameState.InvalidInputException(['ChooseGameMode: Invalid mode: ', sMode]);
	}

	this.AssertPlayerIsValid(sPlayer);
	this.AssertPlayerMayApplyGameModeAction(sPlayer);

	const oLogEntry = {
		action: 'mode',
		data: {
			mode: sMode,
			player: sPlayer
		}
	};

	// In case of imperfect information GameState (maintained by the players
	// 		as opposed to that maintained by the dealer) pot cards is a new info.
	if (sMode == 'augšā') {
		if (! this.oPot.AreAllKnown() && oRevealedPotCards && oRevealedPotCards.AreAllKnown()) {
			this.oPot = oRevealedPotCards;
		}

		if (this.oPot.HasKnown()) {
			oLogEntry.data.cards = [... this.oPot].map(function (oCard)
			{
				return oCard.sCard;
			});
		}
	}

	// Update the derived info.
	this.sGameMode = sMode;
	this.sGameModeBy = sPlayer;

	if (sMode == 'augšā') {
		for (const oCard of this.oPot) {
			this.oHands[sPlayer].Add(oCard);
		}
		this.oPot.Clear();
	}
	else if (sMode == 'zole') {
		if (this.oPot.AreAllKnown()) {
			this.oStats.pot.points += CountPoints(this.oPot);
		}
	}

	// Confirm into the log.
	return this.AddToGameLog(oLogEntry);
};

/**
 * @param {String} sMode galdiņš|pule
 */
GameState.prototype.AgreeOnGameMode = function AgreeOnGameMode (sMode)
{
	// Check.
	if (sMode != 'galdiņš' && sMode != 'pule') {
		throw new GameState.InvalidInputException(['AgreeOnGameMode: Invalid mode: ', sMode]);
	}

	if (this.sGameMode) {
		throw new GameState.GameRulesException(['AgreeOnGameMode: Mode ir already set: ', this.sGameMode, sMode]);
	}

	if (
		this.aGameLog.length < 3
		|| this.aGameLog[this.aGameLog.length - 1].action != 'skip'
		|| this.aGameLog[this.aGameLog.length - 2].action != 'skip'
		|| this.aGameLog[this.aGameLog.length - 3].action != 'skip'
	) {
		throw new GameState.GameRulesException([
			'AgreeOnGameMode: Not the appropriate time for agreeing on game mode.',
			this.aGameLog.length,
			this.aGameLog.length > 0 ? this.aGameLog[this.aGameLog.length - 1] : undefined
		]);
	}

	// Update the derived info.
	this.sGameMode = sMode;

	// Confirm into the log.
	return this.AddToGameLog({
		action: 'mode',
		data: {
			mode: sMode
		}
	});
};

/**
 * TODO Duplicates DiscardCard, only more constructive output (but more general debug output)?
 * @returns {Set}
 */
GameState.prototype.GetAllowedDiscardCardActions = function GameState_GetAllowedDiscardCardActions ()
{
	const oAllowedActions = new Set();

	if (this.sGameMode == 'augšā' && this.oHands[this.sGameModeBy].Size() > 8) {
		for (const oCard of this.oHands[this.sGameModeBy]) {
			oAllowedActions.add({
				action: 'discard',
				data: {
					player: this.sGameModeBy,
					card: oCard.sCard
				}
			});
		}
	}
	// Else: no card can be discarded at the moment.

//	console.log('GetAllowedDiscardCardActions: Returns: ', oAllowedActions);
	return oAllowedActions;
};

/**
 * LV: Norok.
 * Almost the same as PlayCard. TODO The same?
 * @param {String} sPlayer
 * @param {JsCard} oCard
 */
GameState.prototype.DiscardCard = function GameState_DiscardCard (sPlayer, oCard)
{
	// Check.
	this.AssertPlayerIsValid(sPlayer);
	this.AssertCardIsValid(oCard);

	if (! this.oHands[sPlayer].Has(oCard)) {
		throw new GameState.ConsistencyException(['DiscardCard: Player does not have the card ', sPlayer, oCard, this.oHands[sPlayer]]);
	}

	if (this.sGameModeBy != sPlayer) {
		throw new GameState.GameRulesException(
			['DiscardCard: This player is not "lielais" to be able to discard cards: ', sPlayer, oCard, this.sGameModeBy]
		);
	}

	if (this.oHands[sPlayer].Size() <= 8) {
		throw new GameState.GameRulesException(
			['DiscardCard: This is not the time for discarding cards.', sPlayer, oCard, this.oHands[sPlayer]]
		);
	}

	// Update the derived info.
	this.oHands[sPlayer].Remove(oCard);
	this.oDiscardedCards.Add(oCard);

	if (oCard.IsKnown()) {
		this.oStats[sPlayer].points += CountPoints([oCard]);
	}

	// Confirm into the log.
	return this.AddToGameLog({
		action: 'discard',
		data: {
			player: sPlayer,
			card: oCard.sCard
		}
	});
};

/**
 * TODO Duplicates PlayCard,only more constructive output (but more general debug output)?
 * @returns {Set}
 */
GameState.prototype.GetAllowedPlayCardActions = function GameState_GetAllowedPlayCardActions ()
{
	const oAllowedActions = new Set();

	let sPlayer = undefined;

	// A new trick:
	if (this.aLastTrick.length == 3) {
		sPlayer = GameState.GetTrickTaker(this.aLastTrick);
	}
	// Within a trick:
	else if (this.aLastTrick.length >= 1) {
		switch (this.aLastTrick[this.aLastTrick.length - 1].player) {
			case 'A':
				sPlayer = 'B';
				break;
			case 'B':
				sPlayer = 'C';
				break;
			case 'C':
				sPlayer = 'A';
				break;
			default:
		}
	}
	// The first card playing move / the first trick:
	else {
		if (
			this.sGameMode == 'augšā'
			&& (
				this.aGameLog.length >= 2
				&& this.aGameLog[this.aGameLog.length - 1].action == 'discard'
				&& this.aGameLog[this.aGameLog.length - 2].action == 'discard'
			)
			|| _.includes(['zole', 'mazā zole', 'galdiņš'], this.sGameMode)
		) {
			// The first player is always A in the context of GameState / one deal.
			sPlayer = 'A';
		}
		// Else: Game mode not known or unfit for a play move.
	}

	if (sPlayer) {
		const oAllowedCards = (
			this.aLastTrick.length > 0
			? GameState.GetAllowedResponses(this.aLastTrick[0].card, this.oHands[sPlayer])
			: this.oHands[sPlayer]
		);
		for (const oCard of oAllowedCards) {
			oAllowedActions.add({
				action: 'play',
				data: {
					player: sPlayer,
					card: oCard.sCard
				}
			});
		}
	}
	// Else: no card can be played at the moment.

//	console.log('GetAllowedPlayCardActions: Returns: ', oAllowedActions);
	return oAllowedActions;
};

/**
 * TODO Duplicates GetAllowedApplyGameModeActions, only with more helpful error messages?
 * @param {String} sPlayer
 * @param {JsCard} oCard
 */
GameState.prototype.PlayCard = function GameState_PlayCard (sPlayer, oCard)
{
	//
	// Check.
	//

	this.AssertPlayerIsValid(sPlayer);
	this.AssertCardIsValid(oCard);

	// A new trick:
	if (this.aLastTrick.length == 3) {
		if (GameState.GetTrickTaker(this.aLastTrick) != sPlayer) {
			throw new GameState.GameRulesException(
				["PlayCard: It is not this player's turn (trick-taker goes first): ", sPlayer, this.aLastTrick]
			);
		}
	}
	// Within a trick:
	else if (this.aLastTrick.length >= 1) {
		const sPrevPlayer = this.aLastTrick[this.aLastTrick.length - 1].player;
		if (sPlayer != GameState.GetNextPlayer(sPrevPlayer)) {
			throw new GameState.GameRulesException(
				["PlayCard: It is not this player's turn (A->B->C->A): ", sPlayer, this.aLastTrick]
			);
		}
	}
	// The first card playing move / the first trick:
	else {
		if (sPlayer != 'A') {
			// The first player is always A in the context of GameState / one deal.
			throw new GameState.GameRulesException(
				["PlayCard: It is not this player's turn (A always starts): ", sPlayer]
			);
		}

		if (
			this.sGameMode == 'augšā'
			&& (
				this.aGameLog.length < 2
				|| this.aGameLog[this.aGameLog.length - 1].action != 'discard'
				|| this.aGameLog[this.aGameLog.length - 2].action != 'discard'
			)
		) {
			throw new GameState.GameRulesException([
				'PlayCard: "Lielais" have to discard their two cards before the cards can be started to be played.',
				sPlayer,
				this.aGameLog.length >= 1 ? this.aGameLog[this.aGameLog.length - 1] : null
			]);
		}
	}

	// If we clearly do not know that the user has that card but they may have,
	// 		then assume one of the unknown cards to be the one played.
	if (! this.oHands[sPlayer].Has(oCard)
		&& this.oHands[sPlayer].Has(new JsCard(undefined))
		&& ! this.oHands[GameState.GetNextPlayer(sPlayer)].Has(oCard)
		&& ! this.oHands[GameState.GetNextPlayer(GameState.GetNextPlayer(sPlayer))].Has(oCard)
	) {
		this.oHands[sPlayer].Remove(new JsCard(undefined));
		this.oHands[sPlayer].Add(oCard);
	}

	if (! this.oHands[sPlayer].Has(oCard)) {
		throw new GameState.ConsistencyException(['PlayCard: Player does not have the card ', sPlayer, oCard, this.oHands[sPlayer], this]);
	}

	if (
		this.aLastTrick.length > 0 && this.aLastTrick.length < 3
		&& ! GameState.GetAllowedResponses(
			this.aLastTrick[0].card,
			// Add the played card to the player's hand in case the card is unknown in the hand.
			// 		We already know the player has that card from the previous check.
			new CardSet([...this.oHands[sPlayer], oCard])
		).Has(oCard)
	) {
		throw new GameState.GameRulesException([
			'PlayCard: Player may not play this card ',
			sPlayer, oCard, _.cloneDeep(this.aLastTrick), _.cloneDeep(this.oHands[sPlayer]), _.cloneDeep(this)
		]);
	}

	//
	// Update the derived info.
	//

	if (this.aLastTrick.length >= 3) {
		this.aLastTrick = [];
	}

	this.oHands[sPlayer].Remove(oCard);
	this.oPlayedCards[sPlayer].push(oCard);

	this.aLastTrick.push({
		player: sPlayer,
		card: oCard
	});

	if (this.aLastTrick.length >= 3) {
		const sTrickTakenBy = GameState.GetTrickTaker(this.aLastTrick);

		this.oStats[sTrickTakenBy].tricks++;
		this.oStats[sTrickTakenBy].points += CountPoints(
			this.aLastTrick.map(function (oMove) {return oMove.card;})
		);
	}

	// Update the pot/discarded cards in the last move.
	if ((this.sGameMode == 'augšā' || this.sGameMode == 'zole') && this.oHands[sPlayer].Size() === 0 && this.aLastTrick.length >= 3) {
		const oToBeRevealedCards = (this.sGameMode == 'augšā' ? this.oDiscardedCards : this.oPot);

		// From all cards, remove those that were actually played...
		const oAllCards = new CardSet(GetShuffledDeck());
		for (const sPlayer of ['A', 'B', 'C']) {
			for (const oCard of this.oPlayedCards[sPlayer]) {
				oAllCards.Remove(oCard);
			}
		}
		// ... and we're left with the discarded cards.
		const oNotPlayedCards = oAllCards;

		if (! oToBeRevealedCards.AreAllKnown()) {
			// Update.
			oToBeRevealedCards.ReplaceWith(oAllCards);

			// Add to the point count.
			if (this.sGameMode == 'augšā') {
				for (const oCard of this.oDiscardedCards) {
					this.oStats[this.sGameModeBy].points += CountPoints([oCard]);
				}
			}
			else {
				this.oStats.pot.points += CountPoints(this.oPot);
			}
		}
		else {
			// Check.
			if (! oNotPlayedCards.Equals(oToBeRevealedCards)) {
				throw new GameState.ConsistencyException(
					['PlayCard: The discarded/pot cards do not match the not-played cards: ', this.sGameMode, oToBeRevealedCards, oNotPlayedCards]
				);
			}
		}
	}

	// Confirm into the log.
	return this.AddToGameLog({
		action: 'play',
		data: {
			player: sPlayer,
			card: oCard.sCard
		}
	});
};

GameState.FromGameLog = function GameState_FromGameLog ()
{
	// TODO
	console.log('FromGameLog TODO');
};
