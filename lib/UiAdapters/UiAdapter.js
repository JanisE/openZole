/**
 * The base class of UI adapters.
 * @constructor
 */
function UiAdapter ()
{
	// The player order of the current game.
	this.oPlayerOrder = undefined;
}

UiAdapter.prototype.SetUp = function UiAdapter_SetUp ()
{
	return Promise.resolve();
};

UiAdapter.prototype.SetDeck = function UiAdapter_SetDeck ()
{
	return Promise.resolve();
};

UiAdapter.prototype.SetPlayers = function UiAdapter_SetPlayers (aPlayers)
{
	return Promise.resolve();
};

/**
 * See also: UiAdapterCardsJs is overriding.
 */
UiAdapter.prototype.SetPlayerOrder = function UiAdapter_SetPlayerOrder (oPlayerOrder)
{
	this.oPlayerOrder = oPlayerOrder;
};

UiAdapter.prototype.OnStateChange = function UiAdapter_OnStateChange (oLogEntry)
{
//	console.log('UiAdapter.OnStateChange: ', oLogEntry);
	return Promise.resolve();
};

UiAdapter.prototype.AddGameChipsToResult = function UiAdapter_AddGameChipsToResult (oGameChips)
{
	return Promise.resolve();
};

UiAdapter.prototype.DisplayGameRunTotals = function UiAdapter_DisplayGameRunTotals (oGameRunTotals)
{
	return Promise.resolve();
};
