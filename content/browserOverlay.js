// Implementation along the lines of tabbrowser.xml
// http://lxr.mozilla.org/mozilla-central/source/browser/base/content/tabbrowser.xml
//
// The extension "Close Tabs to the Right" also served as a source of some valuable inspirations
// https://github.com/yukihr/CloseTabsToTheRight-FirefoxExtension


if (!closetabstoleft)
	var closetabstoleft = {};

// counterpart to "removeTabsToTheEndFrom()"
closetabstoleft.removeTabsToTheStartFrom = function removeTabsToTheStartFrom(aTab) {
	if (closetabstoleft.warnAboutClosingTabs(aTab)) {
		let tabs = closetabstoleft.getTabsToTheStartFrom(aTab);
		for (let i = 0; i < tabs.length; ++i) {
			gBrowser.removeTab(tabs[i], {animate: true});
		}
	}
};

// counterpart to "getTabsToTheEndFrom()"
closetabstoleft.getTabsToTheStartFrom = function getTabsToTheStartFrom(aTab) {
	var tabsToStart = [];
	let tabs = gBrowser.visibleTabs;
	for (let i = 0; tabs[i] != aTab && i < tabs.length; ++i) {
		if(!tabs[i].pinned)
			tabsToStart.push(tabs[i]);
	}
	return tabsToStart;
};

// relevant rewrite of "warnAboutClosingTabs()"
closetabstoleft.warnAboutClosingTabs = function warnAboutClosingTabs(aTab) {
	var aCloseTabs;
	var tabsToClose = closetabstoleft.getTabsToTheStartFrom(aTab).length;

	if (tabsToClose <= 1)
		return true;

	const pref = "browser.tabs.warnOnCloseOtherTabs";
	var shouldPrompt = Services.prefs.getBoolPref(pref);
	if (!shouldPrompt)
		return true;

	var ps = Services.prompt;

	// default to true: if it were false, we wouldn't get this far
	var warnOnClose = { value: true };
	var bundle = gBrowser.mStringBundle;

	// focus the window before prompting.
	// this will raise any minimized window, which will
	// make it obvious which window the prompt is for and will
	// solve the problem of windows "obscuring" the prompt.
	// see bug #350299 for more details
	window.focus();
	var warningMessage = PluralForm.get(tabsToClose, bundle.getString("tabs.closeWarningMultiple"))
	                               .replace("#1", tabsToClose);
	var buttonPressed =	ps.confirmEx(window,
	                    bundle.getString("tabs.closeWarningTitle"),
	                    warningMessage,
	                    (ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_0)
	                    + (ps.BUTTON_TITLE_CANCEL * ps.BUTTON_POS_1),
	                    bundle.getString("tabs.closeButtonMultiple"),
	                    null, null,
	                    aCloseTabs == gBrowser.closingTabsEnum.ALL ?
							bundle.getString("tabs.closeWarningPromptMe") : null,
	                    warnOnClose);
	var reallyClose = (buttonPressed == 0);

	// don't set the pref unless they press OK and it's false
	if (aCloseTabs == gBrowser.closingTabsEnum.ALL && reallyClose && !warnOnClose.value)
	Services.prefs.setBoolPref(pref, false);

	return reallyClose;
};

// Hide context menuitem for pinned tabs and disable it for the leftmost (unpinned) tab
window.addEventListener("load", function() {
	document.getElementById("tabContextMenu").addEventListener("popupshowing", function(ev) {
		//Must be called after TabContextMenu.updateContextMenu(menupopup)
		if (ev.target !== this) { return; }
		
		var menuitem = document.getElementById("context_closeTabsToTheStart");

		var ltabs = closetabstoleft.getTabsToTheStartFrom(TabContextMenu.contextTab);
		menuitem.disabled = !ltabs.length;
		
		menuitem.hidden = TabContextMenu.contextTab.pinned;
		}, false);
	}, false);
