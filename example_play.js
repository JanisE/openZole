
$('.start_button_base button').on('click', () =>
{
	const jqPlayerType = $('select[name="player_0_type"]');
	jqPlayerType.prop('disabled', true);

	$('.start_button_base').fadeOut();


	// Run the example play.
	const oDealer = new Dealer({
		name: 'Test game',
		description: 'Only computers allowed.',
		start_time: moment().format()
	});

	oDealer.SetUiAdapter(new UiAdapter_CardsJs());

	const oPlayerTypes = {
		UiPlayer: UiPlayer,
		RandomMovesMaker: RandomMovesMaker
	};

	oDealer.SetPlayers([
		new oPlayerTypes[jqPlayerType.val()]({name: 'Katniss'}),
		new RandomMovesMaker({name: 'Rob'}),
		new RandomMovesMaker({name: 'Petar'})
	]);

	oDealer.StartGameRun(5);
});
