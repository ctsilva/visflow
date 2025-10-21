<template>
<div id="app" @contextmenu.prevent>
  <!-- VisTrails viewer route - render without VisFlow UI -->
  <router-view v-if="$route.path === '/vistrails'"></router-view>

  <!-- VisFlow interface for all other routes -->
  <template v-else>
    <app-header></app-header>
    <app-modals></app-modals>
    <system-message></system-message>
    <node-panel></node-panel>
    <quick-node-panel></quick-node-panel>
    <history-panel></history-panel>
    <log-panel></log-panel>
    <flowsense-input></flowsense-input>
    <div id="canvas" @contextmenu.prevent.stop="$refs.contextMenu.open">
      <dataflow-canvas ref="dataflowCanvas"></dataflow-canvas>
    </div>

    <div ref="optionPanelMount"></div>
    <div ref="portPanelMount"></div>
    <div ref="contextMenuMount"></div>
    <div ref="nodeModalMount"></div>

    <context-menu id="context-menu" ref="contextMenu">
      <template slot-scope="slotProps">
        <li @click="addNode" :class="{ disabled: isSystemInVisMode }">
          <i class="fas fa-sm fa-plus"></i>Add Node<span class="shortcut">A</span>
        </li>
        <li v-if="isFlowsenseEnabled" @click="openFlowsenseInput">
          <i class="fas fa-sm fa-keyboard"></i>FlowSense
        </li>
      </template>
    </context-menu>
  </template>
</div>
</template>

<!-- App styles are not scoped because they may affect body and html -->
<style lang="scss" src="./app.scss"></style>

<!-- [Note!] 'lang="ts"' is required for jest test to properly transform vue component with vue-property-decorator. -->
<script lang="ts" src="./app.ts">
</script>
