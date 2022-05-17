import { h, defineComponent, PropType, toRef } from 'vue'
import { useStyle } from '../../../_mixins'
import { ClearIcon } from '../../icons'
import NBaseIcon from '../../icon'
import NIconSwitchTransition from '../../icon-switch-transition'
import style from './styles/index.cssr'
import { resolveSlot } from '../../../_utils'

export default defineComponent({
  name: 'BaseClear',
  props: {
    clsPrefix: {
      type: String,
      required: true
    },
    show: Boolean,
    onClear: Function as PropType<(e: MouseEvent) => void>
  },
  setup (props) {
    useStyle('-base-clear', style, toRef(props, 'clsPrefix'))
    return {
      handleMouseDown (e: MouseEvent) {
        e.preventDefault()
      }
    }
  },
  render () {
    const { clsPrefix } = this
    return (
      <div class={`${clsPrefix}-base-clear`}>
        <NIconSwitchTransition>
          {{
            default: () => {
              return this.show ? (
                <NBaseIcon
                  clsPrefix={clsPrefix}
                  key="dismiss"
                  class={`${clsPrefix}-base-clear__clear`}
                  onClick={this.onClear}
                  onMousedown={this.handleMouseDown}
                  data-clear
                >
                  {{
                    default: () =>
                      resolveSlot(this.$slots['clear-icon'], () => [
                        <ClearIcon />
                      ])
                  }}
                </NBaseIcon>
              ) : (
                <div key="icon" class={`${clsPrefix}-base-clear__placeholder`}>
                  {this.$slots.default?.()}
                </div>
              )
            }
          }}
        </NIconSwitchTransition>
      </div>
    )
  }
})
