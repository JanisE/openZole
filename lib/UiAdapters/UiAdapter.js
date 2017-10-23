/**
 * The base class of UI adapters.
 * @constructor
 */
class UiAdapter
{
	constructor ()
	{
		// The player order of the current game.
		this.oPlayerOrder = undefined;

		// Use "On" method to add handlers.
		this.jqEvents = $({});
	}

	On ()
	{
		this.jqEvents.on(...arguments);
	}

	Off ()
	{
		this.jqEvents.off(...arguments);
	}

	Notice (sMessage)
	{
		console.log(sMessage);
	}

	PresentGameModeOptions ()
	{
		// console.error('Method not overridden.');
	}

	SetUp ()
	{
		return Promise.resolve();
	}

	SetDeck ()
	{
		return Promise.resolve();
	}

	SetPlayers (aPlayers)
	{
		return Promise.resolve();
	}

	/**
	 * See also: UiAdapterCardsJs is overriding.
	 * @param {PlayerOrder} oPlayerOrder
	 */
	SetPlayerOrder (oPlayerOrder)
	{
		this.oPlayerOrder = oPlayerOrder;
	}

	OnStateChange (oLogEntry)
	{
		// console.log('UiAdapter.OnStateChange: ', oLogEntry);
		return Promise.resolve();
	}

	/**
	 * @param {object} oGame As stored in "GameRun.aGames", or returned by "GameRun.AddGame".
	 * {Promise} UI updated.
	 */
	OnGameOver (oGame)
	{
		return Promise.resolve();
	}

	DisplayGameRunTotals (oGameRunTotals)
	{
		return Promise.resolve();
	}
}
