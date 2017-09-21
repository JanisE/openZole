/**
 * Dealer or Game manager.
 * @constructor
 */
function Dealer (oEventInfo)
{
	this.oGameRun = new GameRun();
	this.oGameRun.SetEvent(oEventInfo);

	// The player order of the current game.
	// {A: 0, B: 1, C: 2}, where 0, 1, 2 - index of the player in the player's array (GameRun.aPlayers).
	this.oPlayerOrder = undefined;

	this.oEventsForwardTo = new Set();
	this.oForwardEventsAfterHidingCardsTo = new Set();

	this.oGameState = undefined;

	this.iGamesToPlay = 1;
	this.bGameRunStarted = false;
	this.bEventForwardingWontChange = false;

	this.oUiAdapter = new UiAdapter();
	this.pUiAdapterReady = this.oUiAdapter.SetUp();
}

Dealer.prototype.SetPlayers = function Dealer_SetPlayers (aPlayers)
{
	this.oGameRun.SetPlayers(aPlayers);
	this.oUiAdapter.SetPlayers(aPlayers);
};

/**
 * Should call this before starting the game, if any UI adapter is to be used at all.
 */
Dealer.prototype.SetUiAdapter = function Dealer_SetUiAdapter (oUiAdapter)
{
	this.oUiAdapter = oUiAdapter;

	this.pUiAdapterReady = this.oUiAdapter.SetUp();
};

Dealer.prototype.OnStateChange = function Dealer_OnStateChange (oLogEntry)
{
//	console.log('Dealer.OnStateChange: ', oLogEntry);
//	console.log('Dealer.OnStateChange: this.oEventsForwardTo = ', this.oEventsForwardTo,
//		'; this.oForwardEventsAfterHidingCardsTo = ', this.oForwardEventsAfterHidingCardsTo);

	for (const oPlayer of this.oEventsForwardTo) {
		oPlayer.OnStateChange(_.cloneDeep(oLogEntry));
	}

	const oLogEntryWithHiddenCards = _.cloneDeep(oLogEntry);
	if (oLogEntryWithHiddenCards.data.card) {
		oLogEntryWithHiddenCards.data.card = undefined;
	}

	if (oLogEntryWithHiddenCards.data.cards) {
		// undefined cards vs unset property altogether: maybe it would be better to do it consistently.
		// 		I did not because cards value is somewhat extra to a mode choosing log entry, and needed only
		// 		because of GameStates with imperfect information (GameStates of the players during the game).
		delete oLogEntryWithHiddenCards.data.cards;
	}

	for (const oPlayer of this.oForwardEventsAfterHidingCardsTo) {
		oPlayer.OnStateChange(oLogEntryWithHiddenCards);
	}
};

Dealer.prototype.ForwardEventsTo = function Dealer_ForwardEventsTo (oPlayer)
{
	this.oForwardEventsAfterHidingCardsTo.delete(oPlayer);
	this.oEventsForwardTo.add(oPlayer);
};

Dealer.prototype.ForwardEventsAfterHidingCardsTo = function Dealer_ForwardEventsTo (oPlayer)
{
	this.oEventsForwardTo.delete(oPlayer);
	this.oForwardEventsAfterHidingCardsTo.add(oPlayer);
};

Dealer.prototype.ClearEventForwarding = function Dealer_ClearEventForwarding ()
{
	this.oEventsForwardTo.clear();
	this.oForwardEventsAfterHidingCardsTo.clear();

	this.bEventForwardingWontChange = false;
};

/**
 * @param {number} iPlayerA	Index of the player in this.oPlayers.
 * @param {number} iPlayerB	Index of the player in this.oPlayers.
 * @param {number} iPlayerC	Index of the player in this.oPlayers.
 */
Dealer.prototype.SetPlayerOrder = function Dealer_SetPlayerOrder (iPlayerA, iPlayerB, iPlayerC)
{
	const aPlayers = this.oGameRun.GetPlayers();
	if (! aPlayers[iPlayerA] || ! aPlayers[iPlayerB] || ! aPlayers[iPlayerC]) {
		throw new Error(['Dealer_SetPlayerOrder: Non-existant users: ', iPlayerA, iPlayerB, iPlayerC]);
	}

	this.oPlayerOrder = {
		A: iPlayerA,
		B: iPlayerB,
		C: iPlayerC
	};

	this.oUiAdapter.SetPlayerOrder(this.oPlayerOrder);

//	console.log('Dealer.SetPlayerOrder: this.oPlayerOrder = ', this.oPlayerOrder);
};

/**
 * TODO Currently, only three players supported.
 */
Dealer.prototype.ShiftPlayerOrder = function Dealer_ShiftPlayerOrder ()
{
	let aNewOrder = [0, 1, 2];	// A: 0, B: 1, C: 2

	if (this.oPlayerOrder) {
		aNewOrder = [this.oPlayerOrder.B, this.oPlayerOrder.C, this.oPlayerOrder.A];
	}
	// Else: leave the default (first) order.

	this.SetPlayerOrder(... aNewOrder);
};

/**
 * @param {String} sPlayerLetter A|B|C
 */
Dealer.prototype.GetPlayerByLetter = function Dealer_GetPlayerByLetter (sPlayerLetter)
{
	return this.oGameRun.GetPlayers()[this.oPlayerOrder[sPlayerLetter]];
};

Dealer.prototype.AskForTheNextMove = function Dealer_AskForTheNextMove ()
{
	const fUpdateUi = () =>
	{
		return new Promise((fResolve) =>
		{
			if (this.oGameState.aLastTrick.length >= 3) {
				this.oUiAdapter.MoveTrickToDiscarded(GameState.GetTrickTaker(this.oGameState.aLastTrick))
				.then(fResolve);
			}
			else {
				fResolve();
			}
		})
	};

	const oActions = this.oGameState.GetAllowedActions();
//	console.log('Dealer.AskForTheNextMove, allowed actions = ', oActions);

	if (oActions.size == 2
		&& SelectAnySetItem(oActions).data.mode
		&& _.includes(['pule', 'galdiņš'], SelectAnySetItem(oActions).data.mode)
	) {
		// Common agreement – cannot ask any one particular player to make this move.
		this.HandleAMove({action: 'mode', data: {mode: _.sample(['galdiņš', 'pule'])}});
	}
	// Else a particular player is to make a move.
	else if (oActions.size > 0) {
		if (
			this.oGameState.sGameMode == 'mazā zole' && this.oGameState.aLastTrick.length >= 3 && GameState.GetTrickTaker(this.oGameState.aLastTrick) == this.oGameState.sGameModeBy
		) {
			// The game gets aborted, as the result is already known to all parties.
			fUpdateUi()
			.then(() => this.OnGameOver());
		}
		else {
			fUpdateUi()
			.then(() => this.GetPlayerByLetter(SelectAnySetItem(oActions).data.player).MakeAMove())
			.then(this.HandleAMove.bind(this));
		}
	}
	// Else: the game has ended.
	else {
		fUpdateUi()
		.then(() => this.OnGameOver());
	}
};

Dealer.prototype.HandleAMove = function Dealer_HandleAMove (oAction) {
//	console.log('Dealer.HandleAMove gets a move ', oAction);
//	console.log('Dealer.HandleAMove gets a move ', JSON.stringify(oAction));

	// TODO Check.

	switch (oAction.action) {
	case 'discard':
		this.ForwardEventsTo(this.GetPlayerByLetter(oAction.data.player));
		this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter(GameState.GetNextPlayer(oAction.data.player)));
		this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter(GameState.GetNextPlayer(GameState.GetNextPlayer(oAction.data.player))));
		break;

	case 'mode':
	case 'skip':
		this.ForwardEventsTo(this.GetPlayerByLetter('A'));
		this.ForwardEventsTo(this.GetPlayerByLetter('B'));
		this.ForwardEventsTo(this.GetPlayerByLetter('C'));

		if (oAction.action == 'mode' && oAction.data.mode == 'augšā') {
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter(GameState.GetNextPlayer(oAction.data.player)));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter(GameState.GetNextPlayer(GameState.GetNextPlayer(oAction.data.player))));
		}

		break;

	case 'play':
		if (! this.bEventForwardingWontChange) {
			// Everything visible to all players.
			this.ForwardEventsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsTo(this.GetPlayerByLetter('C'));

			this.bEventForwardingWontChange = true;
		}
		// Else: do not bother reassigning the forwarding, it won't change from now on.
		break;

	default:
		console.error('Dealer_HandleAMove: Unexpected action to handle: ', oAction);
	}

	// TODO Why do I duplicate "Dealer.OnStateChange"'s callback?
	//		Because I need to use the adapter's promise here?
	// 		Because "Dealer.OnStateChange" may happen too late (after GameState triggers an event)
	// 		but I need it here at once?
	this.oUiAdapter.OnStateChange(_.cloneDeep(
		this.oGameState.DoActionByLogEntry(oAction)
	))
	.then(() => this.AskForTheNextMove());
};

Dealer.prototype.StartGameRun = function Dealer_StartGameRun (iGamesToPlay)
{
	if (this.bGameRunStarted) {
		console.error('Do not start the game run twice.');
		return;
	}

	this.iGamesToPlay = iGamesToPlay;
	this.bGameRunStarted = true;

	this.SetPlayerOrder(0, 1, 2);
	this.StartGame();
};

Dealer.prototype.OnGameOver = function Dealer_OnGameOver ()
{
//	console.log('OnGameOver');

	const oGameResult = this.oGameRun.AddGame(
		this.oPlayerOrder,
		this.oGameState
	).oResult;

	this.oUiAdapter.AddGameChipsToResult(oGameResult.oChips)
	.then(() =>
	{
		if (this.oGameRun.GetGameCount() < this.iGamesToPlay) {
			this.ShiftPlayerOrder();
			this.StartGame();
		}
		else {
			console.log(JSON.stringify(this.oGameRun.GetTotals(), null, "\t"));
			console.log(JSON.stringify(this.oGameRun.GetSummaryOfAllGames()));
			console.log(JSON.stringify(this.oGameRun.Export()));

			this.oUiAdapter.DisplayGameRunTotals(this.oGameRun.GetTotals());
		}
	});
};

Dealer.prototype.StartGame = function Dealer_StartGame ()
{
	this.ClearEventForwarding();

	this.GetPlayerByLetter('A').StartGame('A');
	this.GetPlayerByLetter('B').StartGame('B');
	this.GetPlayerByLetter('C').StartGame('C');

	const aDeck = ShuffleCardsInPlace(Zole.GetZoleDeck());
	this.oGameState = new GameState(_.cloneDeep(aDeck));
	this.oGameState.On('state_change', (oEvent, oLogEntry) => this.OnStateChange(oLogEntry));

	this.pUiAdapterReady.then(() =>
	{
		this.oUiAdapter.SetDeck(_.cloneDeep(aDeck))
		.then(() =>
		{
			this.ForwardEventsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('C'));

			this.oGameState.DealCard('A', aDeck[0]);

			// TODO Why do I duplicate "Dealer.OnStateChange"'s callback?
			//		Because I need to use the adapter's promise here?
			// 		Because "Dealer.OnStateChange" may happen too late (after GameState triggers an event)
			// 		but I need it here at once?
			return this.oUiAdapter.OnStateChange({
				action: 'deal',
				data: {player: 'A', card: aDeck[0].sCard}
			});
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('A', aDeck[1])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('A', aDeck[2])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('A', aDeck[3])
			));
		})
		.then(() =>
		{
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('C'));

			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[4])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[5])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[6])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[7])
			));
		})
		.then(() =>
		{
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsTo(this.GetPlayerByLetter('C'));

			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[8])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[9])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[10])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[11])
			));
		})
		.then(() =>
		{
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('C'));

			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCardToPot(aDeck[12])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCardToPot(aDeck[13])
			));
		})
		.then(() =>
		{
			this.ForwardEventsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('C'));

			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('A', aDeck[14])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('A', aDeck[15])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('A', aDeck[16])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('A', aDeck[17])
			));
		})
		.then(() =>
		{
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('C'));

			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[18])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[19])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[20])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('B', aDeck[21])
			));
		})
		.then(() =>
		{

			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('A'));
			this.ForwardEventsAfterHidingCardsTo(this.GetPlayerByLetter('B'));
			this.ForwardEventsTo(this.GetPlayerByLetter('C'));

			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[22])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[23])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[24])
			));
		})
		.then(() =>
		{
			return this.oUiAdapter.OnStateChange(_.cloneDeep(
				this.oGameState.DealCard('C', aDeck[25])
			));
		})
		.then(() =>
		{
			this.AskForTheNextMove();
		});
	});
};