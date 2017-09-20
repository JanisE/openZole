
// Run the example play.

const oDealer = new Dealer({
	name: 'Test game',
	description: 'Only computers allowed.',
	start_time: moment().format()
});

oDealer.SetUiAdapter(new UiAdapter_CardsJs());

oDealer.SetPlayers([
	new RandomMovesMaker({name: 'Katniss'}),
	new RandomMovesMaker({name: 'Rob'}),
	new RandomMovesMaker({name: 'Petar'})
]);

oDealer.StartGameRun(5);
