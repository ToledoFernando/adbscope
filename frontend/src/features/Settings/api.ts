import {ChooseDirectory} from '@/../wailsjs/go/main/App'

// Opens a native folder picker. Returns "" if the user cancels.
export function chooseDirectory(title: string) {
  return ChooseDirectory(title)
}
