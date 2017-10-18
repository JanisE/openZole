/**
 * Plays cards as the user selects in the UI.
 * @param oPlayerInfo
 * @constructor
 */
function UiPlayer (oPlayerInfo)
{
	Player.call(this, oPlayerInfo); // Superclass' constructor.

	this.oPlayerInfo.type = 'human';

	if (!this.oPlayerInfo.name) {
		this.oPlayerInfo.name = 'Human Player';
	}

	this.oUi = null;

	this.fWaitingOnUser = null;	// Callback, waiting for an action from the user.
}
UiPlayer.prototype = Object.create(Player.prototype);
UiPlayer.prototype.constructor = Player;



UiPlayer.prototype.OnCardSelected = function UiPlayer_OnCardSelected (oCard)
{
	if (this.fWaitingOnUser) {
		const oAction = {
			action: (this.oGameState.GetAllowedDiscardCardActions().size > 0 ? 'discard' : 'play'),
			data: {
				player: this.sId,
				card: oCard.sCard
			}
		};

		try {
			this.oGameState.Clone().DoActionByLogEntry(oAction);

			const fCallback = this.fWaitingOnUser;
			// "this.fWaitingOnUser" is also used as a switch, which is safer to be switched off before the callback gets carried out.
			this.fWaitingOnUser = null;
			fCallback(oAction);
		}
		catch (oException) {
			console.log('Illegal move, ignore, keep waiting for a valid one.', oAction, oException);
			this.oUi.Notice('Illegal move.');
		}
	}
};

UiPlayer.prototype.OnGameModeSelected = function UiPlayer_OnCardSelected (sAction)
{
	if (this.fWaitingOnUser) {
		const oAction = {
			action: (sAction == 'skip' ? 'skip' : 'mode'),
			data: {
				player: this.sId,
			}
		};

		if (sAction != 'skip') {
			oAction.data.mode = sAction;
		}

		try {
			this.oGameState.Clone().DoActionByLogEntry(oAction);

			const fCallback = this.fWaitingOnUser;
			// "this.fWaitingOnUser" is also used as a switch, which is safer to be switched off before the callback gets carried out.
			this.fWaitingOnUser = null;
			fCallback(oAction);
		}
		catch (oException) {
			console.log('Illegal move, ignore, keep waiting for a valid one.', oAction, oException);
			this.oUi.Notice('Illegal move.');
		}
	}
};

UiPlayer.HandleOnCardSelected = function UiPlayer_HandleOnCardSelected (oEvent, oCard)
{
	oEvent.data.oPlayer.OnCardSelected(oCard.oCard);
};

UiPlayer.HandleOnGameModeSelected = function UiPlayer_HandleOnGameModeSelected (oEvent, oAction)
{
	oEvent.data.oPlayer.OnGameModeSelected(oAction.sAction);
};

/**
 * @param {UiAdapter} oUi
 */
UiPlayer.prototype.HookUi = function UiPlayer_HookUi (oUi)
{
	if (this.oUi) {
		// Detach from the old UI.
		this.oUi.Off('card_selected', {oPlayer: this}, UiPlayer.HandleOnCardSelected);
		this.oUi.Off('game_mode_selected', {oPlayer: this}, UiPlayer.HandleOnGameModeSelected);
	}

	this.oUi = oUi;
	this.oUi.On('card_selected', {oPlayer: this}, UiPlayer.HandleOnCardSelected);
	this.oUi.On('game_mode_selected', {oPlayer: this}, UiPlayer.HandleOnGameModeSelected);
};

UiPlayer.prototype.MakeAMove = function UiPlayer_MakeAMove ()
{
	return new Promise((fResolve, fReject) =>
	{
		const oActions = this.oGameState.GetAllowedActions();

		if (oActions.size <= 0) {
			fReject();
		}
		else {
			if (this.oGameState.GetAllowedApplyGameModeActions().size > 0) {
				// Must choose a game mode.
				this.oUi.SortCards(this.sId);	// TODO At once, after the last card is dealt. After discarding. Others must not see which cards get discarded.
				this.oUi.PresentGameModeOptions();
			}
			// Else: must discard or play a card.

			// Wait for the user to choose.
			this.fWaitingOnUser = fResolve;
		}
	});
};
